import 'package:flutter/material.dart';

import '../../domain/entities/invoice.dart';

class InvoiceCard extends StatelessWidget {
  const InvoiceCard({super.key, required this.invoice});

  final Invoice invoice;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(invoice.id),
        subtitle: Text(invoice.clientName),
        trailing: Text('${invoice.totalGross.toStringAsFixed(2)} PLN'),
      ),
    );
  }
}
