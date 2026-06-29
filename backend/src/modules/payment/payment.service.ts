import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/app-error";
import { PaymentStatus, ReminderStatus, ReminderType, Prisma } from "@prisma/client";
import { CreatePaymentDTO, CreateTransactionDTO, PaymentFilterQuery } from "./payment.types";

export class PaymentService {
  /**
   * Link a Tally Bill to a quotation, create Payment & initial Transaction
   */
  static async linkBill(userId: string, data: CreatePaymentDTO) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify Quotation
      const quotation = await tx.quotation.findUnique({
        where: { id: data.quotationId },
        include: { customer: true, project: true },
      });

      if (!quotation) {
        throw new AppError("Quotation not found", 404);
      }

      if (quotation.status !== "APPROVED") {
        throw new AppError("Only approved quotations can be linked to Tally bills", 400);
      }

      if (quotation.billCreated) {
        throw new AppError(`Quotation already has a bill linked: #${quotation.billNumber}`, 400);
      }

      const customer = quotation.customer;
      const project = quotation.project;

      if (!customer) {
        throw new AppError("Customer associated with quotation not found", 404);
      }

      if (!project) {
        throw new AppError("Project associated with quotation not found", 404);
      }

      const billDate = new Date(data.billDate);
      const initialReceived = data.initialAmountReceived || 0;
      const totalAmount = data.totalBillAmount;

      if (initialReceived > totalAmount) {
        throw new AppError("Initial amount received cannot exceed total bill amount", 400);
      }

      // 2. Customer Credit Controls
      const pendingAmount = totalAmount - initialReceived;
      const allowCredit = data.allowCredit;

      if (pendingAmount > 0) {
        if (!allowCredit) {
          throw new AppError("Credit is disabled, full bill amount must be paid", 400);
        }
        if (!customer.creditAllowed) {
          throw new AppError(`Credit is not allowed for customer '${customer.name}'`, 400);
        }

        // Validate max credit amount if set (> 0)
        if (Number(customer.maxCreditAmount) > 0) {
          const outstandingAggregate = await tx.payment.aggregate({
            _sum: { pendingAmount: true },
            where: {
              customerId: customer.id,
              status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID, PaymentStatus.OVERDUE] },
            },
          });
          const currentOutstanding = Number(outstandingAggregate._sum.pendingAmount || 0);
          const limit = Number(customer.maxCreditAmount);
          if (currentOutstanding + pendingAmount > limit) {
            throw new AppError(
              `Transaction exceeds credit limit. Current outstanding: ₹${currentOutstanding}, Limit: ₹${limit}, Requested: ₹${pendingAmount}`,
              400
            );
          }
        }
      }

      // 3. Resolve Dates
      const systemSettings = await tx.systemSettings.findUnique({
        where: { id: "default" },
      });

      const defaultCreditDays = customer.defaultCreditDays || systemSettings?.paymentDefaultCreditDays || 30;
      let dueDate = billDate;
      if (allowCredit) {
        dueDate = data.dueDate ? new Date(data.dueDate) : new Date(billDate.getTime() + defaultCreditDays * 24 * 60 * 60 * 1000);
      }

      // Ensure due date is not before bill date
      if (dueDate.getTime() < billDate.getTime()) {
        throw new AppError("Due date cannot be before bill date", 400);
      }

      const creditPeriod = Math.ceil((dueDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));

      // 4. Determine status
      let status: PaymentStatus = PaymentStatus.PENDING;
      if (pendingAmount <= 0) {
        status = PaymentStatus.FULLY_PAID;
      } else if (initialReceived > 0) {
        status = PaymentStatus.PARTIALLY_PAID;
      }

      // Overdue check
      const gracePeriod = systemSettings?.paymentOverdueGracePeriod || 0;
      const graceDueDate = new Date(dueDate.getTime() + gracePeriod * 24 * 60 * 60 * 1000);
      if (pendingAmount > 0 && graceDueDate < new Date()) {
        status = PaymentStatus.OVERDUE;
      }

      // 5. Collection Assignment
      let collectorId = data.collectorId;
      if (!collectorId) {
        const method = systemSettings?.paymentAssignmentMethod || "PERCENTAGE";
        if (method === "PERCENTAGE") {
          // Fetch active salesmen and accountants
          const activeCollectors = await tx.user.findMany({
            where: {
              role: { in: ["SALESMAN", "ACCOUNTANT"] },
              isActive: true,
            },
            orderBy: { id: "asc" },
          });

          if (activeCollectors.length === 0) {
            // Fallback to quotation creator
            collectorId = quotation.createdById;
          } else {
            const weights = (systemSettings?.paymentAssignmentPercentages as Record<string, number>) || {};
            const activeWeights = activeCollectors
              .map((c) => ({
                id: c.id,
                weight: weights[c.id] || 0,
              }))
              .filter((w) => w.weight > 0);

            if (activeWeights.length === 0) {
              collectorId = quotation.createdById;
            } else {
              const totalWeight = activeWeights.reduce((sum, item) => sum + item.weight, 0);
              const randomVal = Math.random() * totalWeight;

              let cumulativeWeight = 0;
              let selectedCollectorId = activeWeights[0].id;
              for (const item of activeWeights) {
                cumulativeWeight += item.weight;
                if (randomVal <= cumulativeWeight) {
                  selectedCollectorId = item.id;
                  break;
                }
              }
              collectorId = selectedCollectorId;
            }
          }
        } else {
          // MANUAL fallback
          collectorId = project.assignedToId || quotation.createdById;
        }
      }

      // 6. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          customerId: customer.id,
          projectId: project.id,
          quotationId: quotation.id,
          salesmanId: quotation.createdById, // the original salesperson who created quotation
          collectorId,
          billNumber: data.billNumber,
          billDate,
          totalBillAmount: totalAmount,
          amountReceived: initialReceived,
          pendingAmount,
          status,
          dueDate,
          creditPeriod,
          remarks: data.remarks,
        },
      });

      // 7. Update Quotation
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          billCreated: true,
          billNumber: data.billNumber,
          billDate,
        },
      });

      // 8. Create Initial Transaction if paid
      if (initialReceived > 0) {
        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            amount: initialReceived,
            paymentMethod: "CASH", // or default/specified payment method
            notes: "Initial payment upon billing",
            updatedById: userId,
            date: billDate,
          },
        });
      }

      // 9. Log Activities
      await tx.customerActivity.create({
        data: {
          customerId: customer.id,
          type: "BILL_LINKED",
          message: `Tally Bill #${data.billNumber} linked to Quotation ${quotation.quotationNumber}. Amount: ₹${totalAmount.toLocaleString()}`,
          metadata: { paymentId: payment.id, billNumber: data.billNumber },
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          userId,
          type: "BILL_LINKED",
          message: `Tally Bill #${data.billNumber} linked. Amount: ₹${totalAmount.toLocaleString()}`,
          metadata: { paymentId: payment.id, billNumber: data.billNumber },
        },
      });

      await tx.customerActivity.create({
        data: {
          customerId: customer.id,
          type: "PAYMENT_CREATED",
          message: `Payment record created for Bill #${data.billNumber}. Collector assigned.`,
        },
      });

      if (initialReceived > 0) {
        const actionType = pendingAmount <= 0 ? "FULL_PAYMENT_RECEIVED" : "PARTIAL_PAYMENT_RECEIVED";
        const msg = pendingAmount <= 0
          ? `Full payment of ₹${initialReceived.toLocaleString()} received for Bill #${data.billNumber}`
          : `Initial partial payment of ₹${initialReceived.toLocaleString()} received for Bill #${data.billNumber}. Remaining: ₹${pendingAmount.toLocaleString()}`;

        await tx.customerActivity.create({
          data: { customerId: customer.id, type: actionType, message: msg },
        });
        await tx.projectActivity.create({
          data: { projectId: project.id, userId, type: actionType, message: msg },
        });
      }

      if (allowCredit && pendingAmount > 0) {
        const msg = `Credit of ₹${pendingAmount.toLocaleString()} granted for Bill #${data.billNumber} until ${dueDate.toLocaleDateString()}`;
        await tx.customerActivity.create({
          data: { customerId: customer.id, type: "CREDIT_GRANTED", message: msg },
        });
        await tx.projectActivity.create({
          data: { projectId: project.id, userId, type: "CREDIT_GRANTED", message: msg },
        });
      }

      // 10. Automatically Create Collection Reminder if balance is pending
      if (pendingAmount > 0) {
        const collector = await tx.user.findUnique({ where: { id: collectorId } });
        const reminderTitle = `Payment Collection: Bill #${data.billNumber}`;
        const reminderDesc = `Customer: ${customer.name}\nProject: ${project.projectName}\nPending Amount: ₹${pendingAmount.toLocaleString()}\nDue Date: ${dueDate.toLocaleDateString()}\nBill Number: ${data.billNumber}`;

        await tx.reminder.create({
          data: {
            title: reminderTitle,
            description: reminderDesc,
            type: ReminderType.PAYMENT,
            dueAt: dueDate,
            userId: collectorId,
            customerId: customer.id,
            projectId: project.id,
            paymentId: payment.id,
            priority: "HIGH",
          },
        });

        const rMsg = `Reminder created for collector ${collector?.name || "assigned person"} due on ${dueDate.toLocaleDateString()}`;
        await tx.customerActivity.create({
          data: { customerId: customer.id, type: "REMINDER_CREATED", message: rMsg },
        });
        await tx.projectActivity.create({
          data: { projectId: project.id, userId, type: "REMINDER_CREATED", message: rMsg },
        });
      }

      return payment;
    });
  }

  /**
   * Record a payment transaction (partial/full payment)
   */
  static async recordTransaction(userId: string, paymentId: string, data: CreateTransactionDTO) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { customer: true, project: true },
      });

      if (!payment) {
        throw new AppError("Payment record not found", 404);
      }

      if (payment.status === "CANCELLED") {
        throw new AppError("Cannot record transaction on a cancelled payment", 400);
      }

      const txAmount = data.amount;
      const newAmountReceived = Number(payment.amountReceived) + txAmount;
      const newPendingAmount = Number(payment.totalBillAmount) - newAmountReceived;

      if (newPendingAmount < -0.01) {
        throw new AppError(
          `Payment exceeds outstanding balance. Max acceptable: ₹${payment.pendingAmount.toLocaleString()}`,
          400
        );
      }

      // Create transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          amount: txAmount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          notes: data.notes,
          updatedById: userId,
          date: new Date(data.date),
        },
      });

      // Recalculate status
      let newStatus: PaymentStatus;
      if (newPendingAmount <= 0) {
        newStatus = PaymentStatus.FULLY_PAID;
      } else {
        newStatus = PaymentStatus.PARTIALLY_PAID;
      }

      // Check if overdue
      if (newPendingAmount > 0) {
        const systemSettings = await tx.systemSettings.findUnique({ where: { id: "default" } });
        const gracePeriod = systemSettings?.paymentOverdueGracePeriod || 0;
        const graceDueDate = new Date(payment.dueDate.getTime() + gracePeriod * 24 * 60 * 60 * 1000);
        if (graceDueDate < new Date()) {
          newStatus = PaymentStatus.OVERDUE;
        }
      }

      // Update payment record
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          amountReceived: newAmountReceived,
          pendingAmount: Math.max(0, newPendingAmount),
          status: newStatus,
        },
      });

      // Log Activities
      const actionType = newPendingAmount <= 0 ? "FULL_PAYMENT_RECEIVED" : "PARTIAL_PAYMENT_RECEIVED";
      const message = newPendingAmount <= 0
        ? `Full payment of ₹${txAmount.toLocaleString()} received via ${data.paymentMethod} for Bill #${payment.billNumber}`
        : `Partial payment of ₹${txAmount.toLocaleString()} received via ${data.paymentMethod} for Bill #${payment.billNumber}. Remaining: ₹${Math.max(0, newPendingAmount).toLocaleString()}`;

      await tx.customerActivity.create({
        data: { customerId: payment.customerId, type: actionType, message },
      });
      await tx.projectActivity.create({
        data: { projectId: payment.projectId, userId, type: actionType, message },
      });

      // Reminders Logic
      if (newPendingAmount <= 0) {
        // Mark all reminders as completed
        const pendingReminders = await tx.reminder.findMany({
          where: { paymentId: payment.id, status: ReminderStatus.PENDING },
        });

        for (const reminder of pendingReminders) {
          await tx.reminder.update({
            where: { id: reminder.id },
            data: {
              status: ReminderStatus.COMPLETED,
              completedAt: new Date(),
            },
          });

          const rMsg = `Reminder Completed: ${reminder.title}`;
          await tx.customerActivity.create({
            data: { customerId: payment.customerId, type: "REMINDER_COMPLETED", message: rMsg },
          });
          await tx.projectActivity.create({
            data: { projectId: payment.projectId, userId, type: "REMINDER_COMPLETED", message: rMsg },
          });
        }
      } else {
        // Update description on existing reminders to reflect new outstanding balance
        await tx.reminder.updateMany({
          where: { paymentId: payment.id, status: ReminderStatus.PENDING },
          data: {
            description: `Customer: ${payment.customer.name}\nProject: ${payment.project.projectName}\nPending Amount: ₹${Math.max(0, newPendingAmount).toLocaleString()}\nDue Date: ${payment.dueDate.toLocaleDateString()}\nBill Number: ${payment.billNumber}`,
          },
        });
      }

      return { payment: updatedPayment, transaction };
    });
  }

  /**
   * Cancel a payment (bill voided)
   */
  static async cancelPayment(userId: string, paymentId: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { customer: true, project: true },
      });

      if (!payment) {
        throw new AppError("Payment record not found", 404);
      }

      if (payment.status === "CANCELLED") {
        throw new AppError("Payment is already cancelled", 400);
      }

      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.CANCELLED, pendingAmount: 0 },
      });

      // Reset quotation bill fields
      await tx.quotation.update({
        where: { id: payment.quotationId },
        data: { billCreated: false, billNumber: null, billDate: null },
      });

      // Cancel related reminders
      const pendingReminders = await tx.reminder.findMany({
        where: { paymentId: payment.id, status: ReminderStatus.PENDING },
      });

      for (const reminder of pendingReminders) {
        await tx.reminder.update({
          where: { id: reminder.id },
          data: { status: ReminderStatus.CANCELLED },
        });
      }

      // Log activities
      const msg = `Payment for Bill #${payment.billNumber} cancelled / voided.`;
      await tx.customerActivity.create({
        data: { customerId: payment.customerId, type: "PAYMENT_CANCELLED", message: msg },
      });
      await tx.projectActivity.create({
        data: { projectId: payment.projectId, userId, type: "PAYMENT_CANCELLED", message: msg },
      });

      return updated;
    });
  }

  /**
   * Retrieve paginated payments with filters
   */
  static async getAll(filters: PaymentFilterQuery) {
    // Perform dynamic scan of overdue status on queries for safety
    await this.updateOverduePaymentsInternal();

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.salesmanId) {
      where.salesmanId = filters.salesmanId;
    }
    if (filters.collectorId) {
      where.collectorId = filters.collectorId;
    }
    if (filters.search) {
      where.OR = [
        { billNumber: { contains: filters.search, mode: "insensitive" } },
        { customer: { name: { contains: filters.search, mode: "insensitive" } } },
        { project: { projectName: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, mobile: true, creditAllowed: true } },
          project: { select: { id: true, projectName: true } },
          quotation: { select: { id: true, quotationNumber: true } },
          collector: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Retrieve single payment details
   */
  static async getById(id: string) {
    // Perform overdue update
    await this.updateOverduePaymentsInternal();

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        quotation: true,
        collector: { select: { id: true, name: true, role: true } },
        salesman: { select: { id: true, name: true } },
        accountant: { select: { id: true, name: true } },
        transactions: {
          include: { updatedBy: { select: { id: true, name: true } } },
          orderBy: { date: "desc" },
        },
        reminders: {
          orderBy: { dueAt: "asc" },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment record not found", 404);
    }

    return payment;
  }

  /**
   * Internal helper to scan and update overdue payments
   */
  private static async updateOverduePaymentsInternal() {
    try {
      const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
      const graceDays = settings?.paymentOverdueGracePeriod || 0;
      const now = new Date();

      const overduePayments = await prisma.payment.findMany({
        where: {
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID] },
          pendingAmount: { gt: 0 },
        },
      });

      for (const payment of overduePayments) {
        const graceDate = new Date(payment.dueDate.getTime() + graceDays * 24 * 60 * 60 * 1000);
        if (graceDate < now) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.OVERDUE },
            });

            const msg = `Payment for Bill #${payment.billNumber} marked as OVERDUE.`;
            await tx.customerActivity.create({
              data: { customerId: payment.customerId, type: "PAYMENT_OVERDUE", message: msg },
            });
            await tx.projectActivity.create({
              data: { projectId: payment.projectId, type: "PAYMENT_OVERDUE", message: msg },
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to run internal update of overdue payments:", err);
    }
  }
}
