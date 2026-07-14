import PageHeader from "../components/ui/PageHeader";
import ProductList from "../modules/product/ProductList";

export default function ProductPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="The full product catalogue with pricing and stock."
      />

      <ProductList />
    </>
  );
}
