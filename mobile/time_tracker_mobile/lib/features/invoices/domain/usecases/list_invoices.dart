import '../entities/invoice.dart';
import '../repositories/invoice_repository.dart';

class ListInvoices {
  const ListInvoices(this.repository);

  final InvoiceRepository repository;

  Future<List<Invoice>> call() => repository.listInvoices();
}
