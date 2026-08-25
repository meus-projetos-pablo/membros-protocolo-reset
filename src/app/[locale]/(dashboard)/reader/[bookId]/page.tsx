import { getBookContent } from "@/actions/books";
import { redirect } from "next/navigation";
import { ReaderClient } from "./ReaderClient";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ bookId: string; locale: string }>;
}) {
  const { bookId, locale } = await params;
  const book = await getBookContent(bookId);

  if (!book) {
    redirect(`/${locale}/dashboard`);
  }

  return <ReaderClient book={book} locale={locale} />;
}
