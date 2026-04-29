import 'package:flutter_test/flutter_test.dart';
import 'package:time_tracker_mobile/features/invoices/data/datasources/invoice_local_data_source.dart';
import 'package:time_tracker_mobile/features/invoices/data/repositories/invoice_repository_impl.dart';

void main() {
  test('returns seed invoices', () async {
    final repository = InvoiceRepositoryImpl(InvoiceLocalDataSource());
    final invoices = await repository.listInvoices();
    expect(invoices, isNotEmpty);
  });
}
