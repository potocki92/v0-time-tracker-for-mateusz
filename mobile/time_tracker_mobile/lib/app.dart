import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'bootstrap/env_config.dart';
import 'features/invoices/data/datasources/invoice_local_data_source.dart';
import 'features/invoices/data/repositories/invoice_repository_impl.dart';
import 'features/invoices/domain/usecases/list_invoices.dart';
import 'features/invoices/presentation/cubit/invoice_cubit.dart';
import 'features/invoices/presentation/pages/invoices_page.dart';

class TimeTrackerApp extends StatelessWidget {
  const TimeTrackerApp({super.key, required this.config});

  final EnvConfig config;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => InvoiceCubit(
        ListInvoices(InvoiceRepositoryImpl(InvoiceLocalDataSource())),
      )..load(),
      child: MaterialApp(
        title: config.appTitle,
        debugShowCheckedModeBanner: false,
        home: const SafeArea(child: InvoicesPage()),
      ),
    );
  }
}
