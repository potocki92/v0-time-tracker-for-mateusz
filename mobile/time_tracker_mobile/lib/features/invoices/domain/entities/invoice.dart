import 'package:equatable/equatable.dart';

class Invoice extends Equatable {
  const Invoice({required this.id, required this.clientName, required this.totalGross});

  final String id;
  final String clientName;
  final double totalGross;

  @override
  List<Object?> get props => [id, clientName, totalGross];
}
