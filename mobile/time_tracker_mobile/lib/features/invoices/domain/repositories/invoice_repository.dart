import '../entities/invoice.dart';

abstract class InvoiceRepository {
  Future<List<Invoice>> listInvoices();
}
