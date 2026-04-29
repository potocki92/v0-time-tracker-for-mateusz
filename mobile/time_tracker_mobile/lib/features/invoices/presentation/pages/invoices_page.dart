import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../cubit/invoice_cubit.dart';
import '../cubit/invoice_state.dart';
import '../widgets/invoice_card.dart';

class InvoicesPage extends StatelessWidget {
  const InvoicesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Invoices')),
      body: BlocBuilder<InvoiceCubit, InvoiceState>(
        builder: (context, state) {
          if (state.loading) return const Center(child: CircularProgressIndicator());
          if (state.error != null) return Center(child: Text('Error: ${state.error}'));
          if (state.invoices.isEmpty) return const Center(child: Text('No invoices'));
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: state.invoices.length,
            itemBuilder: (context, index) => InvoiceCard(invoice: state.invoices[index]),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.read<InvoiceCubit>().load(),
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
