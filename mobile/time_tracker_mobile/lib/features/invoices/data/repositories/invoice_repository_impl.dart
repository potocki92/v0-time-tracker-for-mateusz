import '../../domain/entities/invoice.dart';
import '../../domain/repositories/invoice_repository.dart';
import '../datasources/invoice_local_data_source.dart';

class InvoiceRepositoryImpl implements InvoiceRepository {
  const InvoiceRepositoryImpl(this.localDataSource);

  final InvoiceLocalDataSource localDataSource;

  @override
  Future<List<Invoice>> listInvoices() => localDataSource.getInvoices();
}
