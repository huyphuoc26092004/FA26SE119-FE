import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/api_client.dart';
import '../core/i18n.dart';
import '../core/theme.dart';

/// Building blocks for the screens, ported from the web app's MobileKit:
/// rounded cards on a light canvas, pill buttons, thin bars and score rings.

class ScreenList extends StatelessWidget {
  const ScreenList({super.key, required this.children, this.onRefresh, this.bottomPadding = 24});
  final List<Widget> children;
  final Future<void> Function()? onRefresh;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    final list = ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(16, 16, 16, bottomPadding),
      itemCount: children.length,
      separatorBuilder: (_, _) => const SizedBox(height: 16),
      itemBuilder: (_, i) => children[i],
    );
    if (onRefresh == null) return list;
    return RefreshIndicator(color: AppColors.brand, onRefresh: onRefresh!, child: list);
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.title, {super.key, this.action, this.onAction});
  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(left: 4, right: 4, top: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Expanded(child: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w500))),
            if (action != null)
              GestureDetector(
                onTap: onAction,
                child: Text(action!, style: const TextStyle(fontSize: 14, color: AppColors.brand)),
              ),
          ],
        ),
      );
}

class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(16), this.dark = false});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsets padding;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(16);
    return Material(
      color: dark ? AppColors.night : AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: radius,
        side: BorderSide(color: dark ? AppColors.night : AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        highlightColor: AppColors.slate100,
        splashColor: Colors.transparent,
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

enum ButtonTone { primary, secondary, danger }

class BigButton extends StatelessWidget {
  const BigButton({super.key, required this.label, this.onPressed, this.tone = ButtonTone.primary, this.icon, this.busy = false});
  final String label;
  final VoidCallback? onPressed;
  final ButtonTone tone;
  final IconData? icon;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, border) = switch (tone) {
      ButtonTone.primary => (AppColors.ink, Colors.white, AppColors.ink),
      ButtonTone.secondary => (AppColors.surface, AppColors.ink, AppColors.ink.withValues(alpha: .25)),
      ButtonTone.danger => (AppColors.surface, AppColors.danger, const Color(0xFFF0C9C2)),
    };
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: TextButton(
        onPressed: busy ? null : onPressed,
        style: TextButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: bg.withValues(alpha: .5),
          disabledForegroundColor: fg.withValues(alpha: .7),
          shape: StadiumBorder(side: BorderSide(color: border)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),
        child: busy
            ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: fg))
            : Row(mainAxisSize: MainAxisSize.min, children: [
                Text(label),
                if (icon != null) ...[const SizedBox(width: 8), Icon(icon, size: 17)],
              ]),
      ),
    );
  }
}

class Pill extends StatelessWidget {
  const Pill({super.key, required this.label, this.onTap, this.active = false});
  final String label;
  final VoidCallback? onTap;
  final bool active;

  @override
  Widget build(BuildContext context) => Material(
        color: active ? AppColors.ink : AppColors.surface,
        shape: StadiumBorder(side: BorderSide(color: active ? AppColors.ink : AppColors.ink.withValues(alpha: .2))),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            child: Text(label, style: TextStyle(fontSize: 13, color: active ? Colors.white : AppColors.ink)),
          ),
        ),
      );
}

class PillRow extends StatelessWidget {
  const PillRow({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(children: [
          for (final c in children) Padding(padding: const EdgeInsets.only(right: 8), child: c),
        ]),
      );
}

enum TagTone { neutral, brand, warn, danger }

class Tag extends StatelessWidget {
  const Tag(this.label, {super.key, this.tone = TagTone.neutral, this.icon});
  final String label;
  final TagTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      TagTone.neutral => (AppColors.slate100, const Color(0xFF3F4843)),
      TagTone.brand => (AppColors.brand50, AppColors.brand700),
      TagTone.warn => (AppColors.warning50, AppColors.warning),
      TagTone.danger => (AppColors.danger50, AppColors.danger),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 12, color: fg), const SizedBox(width: 4)],
        Text(label, style: TextStyle(fontSize: 12, color: fg)),
      ]),
    );
  }
}

class ScoreRing extends StatelessWidget {
  const ScoreRing({super.key, required this.value, this.size = 56});
  final int? value;
  final double size;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: size,
        height: size,
        child: CustomPaint(
          painter: _RingPainter((value ?? 0).clamp(0, 100) / 100),
          child: Center(
            child: Text(value?.toString() ?? '–',
                style: TextStyle(fontSize: size * .27, fontWeight: FontWeight.w500, fontFeatures: const [FontFeature.tabularFigures()])),
          ),
        ),
      );
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.progress);
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 4.0;
    final rect = Offset.zero & size;
    final r = rect.deflate(stroke / 2);
    final track = Paint()
      ..color = AppColors.slate200
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke;
    final arc = Paint()
      ..color = AppColors.brand
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = stroke;
    canvas.drawArc(r, 0, math.pi * 2, false, track);
    if (progress > 0) canvas.drawArc(r, -math.pi / 2, math.pi * 2 * progress, false, arc);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress;
}

class ThinBar extends StatelessWidget {
  const ThinBar({super.key, required this.value, this.dark = false});
  final num value;
  final bool dark;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(99),
        child: LinearProgressIndicator(
          value: (value.clamp(0, 100)) / 100,
          minHeight: 6,
          backgroundColor: dark ? Colors.white.withValues(alpha: .15) : AppColors.slate200,
          color: dark ? AppColors.mint : AppColors.brand,
        ),
      );
}

class ListGroup extends StatelessWidget {
  const ListGroup({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(),
            children[i],
          ],
        ]),
      );
}

class ListRowTile extends StatelessWidget {
  const ListRowTile({super.key, required this.icon, required this.title, this.detail, this.onTap, this.danger = false});
  final IconData icon;
  final String title;
  final String? detail;
  final VoidCallback? onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: danger ? AppColors.danger50 : AppColors.brand50,
                child: Icon(icon, size: 18, color: danger ? AppColors.danger : AppColors.brand),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: TextStyle(fontSize: 15, color: danger ? AppColors.danger : AppColors.ink)),
                  if (detail != null && detail!.isNotEmpty)
                    Text(detail!, style: const TextStyle(fontSize: 13, color: AppColors.subtle), overflow: TextOverflow.ellipsis),
                ]),
              ),
              if (!danger) const Icon(Icons.chevron_right, size: 20, color: AppColors.subtle),
            ]),
          ),
        ),
      );
}

class Skeleton extends StatelessWidget {
  const Skeleton({super.key, this.rows = 3});
  final int rows;

  @override
  Widget build(BuildContext context) => Column(children: [
        for (var i = 0; i < rows; i++)
          Container(
            height: 112,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: AppColors.slate200.withValues(alpha: .7), borderRadius: BorderRadius.circular(16)),
          ),
      ]);
}

class EmptyBox extends StatelessWidget {
  const EmptyBox({super.key, required this.title, this.action});
  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFC9CEC6)),
        ),
        child: Column(children: [
          Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 15)),
          if (action != null) ...[const SizedBox(height: 16), action!],
        ]),
      );
}

/// Error card with a retry button, used for every failed request.
class ErrorBox extends StatelessWidget {
  const ErrorBox({super.key, required this.error, this.onRetry});
  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.danger50, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(ApiException.from(error).message, style: const TextStyle(fontSize: 14, color: AppColors.danger)),
          if (onRetry != null)
            TextButton(
              onPressed: onRetry,
              style: TextButton.styleFrom(padding: EdgeInsets.zero, foregroundColor: AppColors.danger),
              child: Text(tr('Thử lại', 'Retry')),
            ),
        ]),
      );
}

class InfoRow extends StatelessWidget {
  const InfoRow(this.label, this.value, {super.key});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(fontSize: 14, color: AppColors.muted)),
          const SizedBox(width: 16),
          Expanded(child: Text(value, textAlign: TextAlign.right, style: const TextStyle(fontSize: 14))),
        ]),
      );
}

class Initials extends StatelessWidget {
  const Initials(this.name, {super.key, this.size = 44, this.dark = false});
  final String name;
  final double size;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final parts = name.replaceAll(RegExp(r'\(.*?\)'), '').split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    final text = parts.isEmpty ? 'U' : parts.map((p) => p[0]).toList().sublist(math.max(0, parts.length - 2)).join().toUpperCase();
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(shape: BoxShape.circle, color: dark ? AppColors.night : AppColors.brand50),
      child: Text(text,
          style: TextStyle(fontSize: size * .34, fontWeight: FontWeight.w500, color: dark ? Colors.white : AppColors.brand700)),
    );
  }
}

/// Bottom sheet with a title, a sentence and stacked buttons.
Future<T?> showActionSheet<T>(BuildContext context, {required String title, required String body, required List<Widget> actions}) {
  return showModalBottomSheet<T>(
    context: context,
    backgroundColor: AppColors.canvas,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (_) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(fontSize: 14, height: 1.5, color: AppColors.muted)),
          const SizedBox(height: 20),
          for (final a in actions) Padding(padding: const EdgeInsets.only(bottom: 12), child: a),
        ]),
      ),
    ),
  );
}

void toast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message, textAlign: TextAlign.center)));
}

String relativeDate(DateTime? d) {
  if (d == null) return '';
  final diff = DateTime.now().difference(d);
  if (diff.inDays >= 30) return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  if (diff.inDays >= 1) return tr('${diff.inDays} ngày trước', '${diff.inDays}d ago');
  if (diff.inHours >= 1) return tr('${diff.inHours} giờ trước', '${diff.inHours}h ago');
  return tr('Vừa xong', 'Just now');
}

/// One chat message; used by the assistant and support threads.
class ChatBubble extends StatelessWidget {
  const ChatBubble({super.key, required this.text, required this.mine, this.name, this.time, this.footer});
  final String text;
  final bool mine;
  final String? name;
  final DateTime? time;
  final Widget? footer;

  @override
  Widget build(BuildContext context) => Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .82),
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: mine ? AppColors.ink : AppColors.surface,
            border: mine ? null : Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (!mine && name != null) Text(name!, style: const TextStyle(fontSize: 12, color: AppColors.brand)),
            SelectableText(text, style: TextStyle(fontSize: 14, height: 1.45, color: mine ? Colors.white : AppColors.ink)),
            if (time != null) ...[
              const SizedBox(height: 2),
              Text(relativeDate(time),
                  style: TextStyle(fontSize: 11, color: mine ? Colors.white.withValues(alpha: .6) : AppColors.subtle)),
            ],
            ?footer,
          ]),
        ),
      );
}

/// Text box with a send button, pinned above the keyboard.
class ChatComposer extends StatelessWidget {
  const ChatComposer({super.key, required this.controller, required this.onSend, required this.hint, this.sending = false});
  final TextEditingController controller;
  final VoidCallback onSend;
  final String hint;
  final bool sending;

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(color: AppColors.canvas, border: Border(top: BorderSide(color: AppColors.border))),
        padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
        child: SafeArea(
          top: false,
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: controller,
                minLines: 1,
                maxLines: 4,
                decoration: InputDecoration(hintText: hint, contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              style: IconButton.styleFrom(backgroundColor: AppColors.ink),
              onPressed: sending ? null : onSend,
              icon: sending
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.arrow_upward, color: Colors.white),
            ),
          ]),
        ),
      );
}
