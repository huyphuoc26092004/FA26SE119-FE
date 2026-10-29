/// Helpers for reading backend JSON without crashing on small shape
/// differences (wrapped `data` envelope, Spring `Page` objects, renamed keys).
typedef Json = Map<String, dynamic>;

/// Strips a `{ success, data }` / `{ data }` envelope if present.
dynamic unwrap(dynamic body) {
  if (body is Map && body.containsKey('data') && body.length <= 5) {
    return body['data'];
  }
  return body;
}

/// Returns the list inside a response: a bare list, a Spring page
/// (`content`), or common keys like `items` / `results`.
List<Json> asList(dynamic body) {
  final b = unwrap(body);
  if (b is List) return b.whereType<Map>().map((e) => Json.from(e)).toList();
  if (b is Map) {
    for (final k in const ['content', 'items', 'results', 'data', 'records']) {
      final v = b[k];
      if (v is List) return v.whereType<Map>().map((e) => Json.from(e)).toList();
    }
  }
  return const [];
}

Json asMap(dynamic body) {
  final b = unwrap(body);
  return b is Map ? Json.from(b) : <String, dynamic>{};
}

/// First non-null value among [keys]. Supports dotted paths (`company.name`).
dynamic pick(Json j, List<String> keys) {
  for (final k in keys) {
    dynamic cur = j;
    for (final part in k.split('.')) {
      cur = cur is Map ? cur[part] : null;
    }
    if (cur != null && cur != '') return cur;
  }
  return null;
}

String? str(Json j, List<String> keys) {
  final v = pick(j, keys);
  if (v == null) return null;
  if (v is Map) return (v['name'] ?? v['title'] ?? v['label'])?.toString();
  return v.toString();
}

num? number(Json j, List<String> keys) {
  final v = pick(j, keys);
  if (v is num) return v;
  if (v is String) return num.tryParse(v);
  return null;
}

bool flag(Json j, List<String> keys) {
  final v = pick(j, keys);
  return v == true || v == 'true';
}

/// List of strings from either `["a","b"]` or `[{name:"a"}, …]`.
List<String> strings(Json j, List<String> keys) {
  final v = pick(j, keys);
  if (v is List) {
    return v
        .map((e) => e is Map ? (e['name'] ?? e['skill_name'] ?? e['title'] ?? e['message'] ?? e['description'] ?? e['text'] ?? e['issue']) : e)
        .where((e) => e != null && e.toString().isNotEmpty)
        .map((e) => e.toString())
        .toList();
  }
  if (v is String && v.trim().isNotEmpty) {
    return v.split(RegExp(r'\n|;|•')).map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }
  return const [];
}

List<Json> maps(Json j, List<String> keys) {
  final v = pick(j, keys);
  if (v is List) return v.whereType<Map>().map((e) => Json.from(e)).toList();
  return const [];
}

DateTime? date(Json j, List<String> keys) {
  final v = pick(j, keys);
  return v is String ? DateTime.tryParse(v)?.toLocal() : null;
}

/// Scores may arrive as 0–1 or 0–100; always return 0–100.
int percent(num? v) {
  if (v == null) return 0;
  final p = v <= 1 ? v * 100 : v;
  return p.round().clamp(0, 100);
}
