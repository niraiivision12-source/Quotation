interface Props {
  title: string;
}

export default function EmptyState({ title }: Props) {
  return <div className="text-center py-10">{title}</div>;
}
