import '../models/invoice_model.dart';

class InvoiceLocalDataSource {
  Future<List<InvoiceModel>> getInvoices() async {
    return const [
      InvoiceModel(id: 'FV/1/2026', clientName: 'ACME Sp. z o.o.', totalGross: 1230.00),
      InvoiceModel(id: 'FV/2/2026', clientName: 'Globex LLC', totalGross: 599.99),
    ];
  }
}
