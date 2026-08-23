import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class WalletProvider with ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  double _balance = 10000.0;
  List<Map<String, dynamic>> _transactions = [];
  StreamSubscription? _walletSubscription;
  StreamSubscription? _txSubscription;

  double get balance => _balance;
  List<Map<String, dynamic>> get transactions => _transactions;

  WalletProvider() {
    _initListener();
  }

  void _initListener() {
    _auth.authStateChanges().listen((user) {
      if (user != null) {
        _subscribeToWallet(user.uid);
      } else {
        _unsubscribe();
      }
    });
  }

  void _subscribeToWallet(String uid) {
    _unsubscribe();

    // 1. Realtime Firestore Balance Listener
    _walletSubscription = _firestore.collection('wallets').doc(uid).snapshots().listen((doc) {
      if (doc.exists) {
        _balance = (doc.data()?['balance'] as num?)?.toDouble() ?? 10000.0;
        notifyListeners();
      }
    });

    // 2. Realtime Firestore Transaction Ledger Listener
    _txSubscription = _firestore
        .collection('walletTransactions')
        .where('uid', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .limit(20)
        .snapshots()
        .listen((snapshot) {
      _transactions = snapshot.docs.map((d) => d.data()).toList();
      notifyListeners();
    });
  }

  void _unsubscribe() {
    _walletSubscription?.cancel();
    _txSubscription?.cancel();
  }

  @override
  void dispose() {
    _unsubscribe();
    super.dispose();
  }
}
