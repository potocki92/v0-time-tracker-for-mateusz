import '../../domain/entities/invoice.dart';

class InvoiceModel extends Invoice {
  const InvoiceModel({required super.id, required super.clientName, required super.totalGross});

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'] as String,
      clientName: json['clientName'] as String,
      totalGross: (json['totalGross'] as num).toDouble(),
    );
  }
}
