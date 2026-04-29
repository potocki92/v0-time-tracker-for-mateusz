import 'package:equatable/equatable.dart';

import '../../domain/entities/invoice.dart';

class InvoiceState extends Equatable {
  const InvoiceState({this.loading = false, this.invoices = const [], this.error});

  final bool loading;
  final List<Invoice> invoices;
  final String? error;

  InvoiceState copyWith({bool? loading, List<Invoice>? invoices, String? error}) {
    return InvoiceState(
      loading: loading ?? this.loading,
      invoices: invoices ?? this.invoices,
      error: error,
    );
  }

  @override
  List<Object?> get props => [loading, invoices, error];
}
