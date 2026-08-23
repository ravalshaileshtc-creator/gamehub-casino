import 'package:cloud_functions/cloud_functions.dart';

class CloudFunctionsService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  // 🎲 Process Dice Roll
  Future<Map<String, dynamic>> rollDice({
    required double stake,
    required int target,
    required String mode,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processDiceRoll');
    final response = await callable.call({
      'stake': stake,
      'target': target,
      'mode': mode,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // 💣 Process Mines Action
  Future<Map<String, dynamic>> processMines({
    required String action,
    required double stake,
    required int minesCount,
    int? tileIndex,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processMinesAction');
    final response = await callable.call({
      'action': action,
      'stake': stake,
      'minesCount': minesCount,
      'tileIndex': tileIndex,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // 💥 Process Crash Action
  Future<Map<String, dynamic>> processCrash({
    required String action,
    required double stake,
    double? targetMultiplier,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processCrashAction');
    final response = await callable.call({
      'action': action,
      'stake': stake,
      'targetMultiplier': targetMultiplier,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // 🎯 Process Plinko Drop
  Future<Map<String, dynamic>> dropPlinkoBall({
    required double stake,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processPlinkoDrop');
    final response = await callable.call({
      'stake': stake,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // 🎡 Process Roulette Spin
  Future<Map<String, dynamic>> spinRoulette({
    required double stake,
    required String betType,
    int? selectedValue,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processRouletteSpin');
    final response = await callable.call({
      'stake': stake,
      'betType': betType,
      'selectedValue': selectedValue,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // 🎰 Process Slot Spin
  Future<Map<String, dynamic>> spinSlot({
    required double stake,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processSlotSpin');
    final response = await callable.call({
      'stake': stake,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // 🪙 Process Coinflip
  Future<Map<String, dynamic>> flipCoin({
    required double stake,
    required String choice,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processCoinflip');
    final response = await callable.call({
      'stake': stake,
      'choice': choice,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // ⚽ Process Penalty Shootout
  Future<Map<String, dynamic>> shootPenalty({
    required double stake,
    required int targetZone,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processPenaltyShoot');
    final response = await callable.call({
      'stake': stake,
      'targetZone': targetZone,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }

  // 🔮 Process Lottery Ticket
  Future<Map<String, dynamic>> buyLotteryTicket({
    required double stake,
    required String mode,
    required List<int> chosenNumbers,
    required String requestId,
  }) async {
    final callable = _functions.httpsCallable('processLotteryTicket');
    final response = await callable.call({
      'stake': stake,
      'mode': mode,
      'chosenNumbers': chosenNumbers,
      'requestId': requestId,
    });
    return Map<String, dynamic>.from(response.data);
  }
}
