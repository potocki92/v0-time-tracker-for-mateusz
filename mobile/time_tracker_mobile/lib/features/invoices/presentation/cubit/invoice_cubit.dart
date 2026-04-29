import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/list_invoices.dart';
import 'invoice_state.dart';

class InvoiceCubit extends Cubit<InvoiceState> {
  InvoiceCubit(this.listInvoices) : super(const InvoiceState());

  final ListInvoices listInvoices;

  Future<void> load() async {
    emit(state.copyWith(loading: true, error: null));
    try {
      final result = await listInvoices();
      emit(state.copyWith(loading: false, invoices: result));
    } catch (e) {
      emit(state.copyWith(loading: false, error: e.toString()));
    }
  }
}
