import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/i18n.dart';
import 'core/theme.dart';
import 'features/account/account_screen.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/login_screen.dart';
import 'features/consultations/consultations_screen.dart';
import 'features/home/home_screen.dart';
import 'features/jobs/job_detail_screen.dart';
import 'features/jobs/jobs_screen.dart';
import 'features/resumes/resume_detail_screen.dart';
import 'features/resumes/resumes_screen.dart';
import 'widgets/kit.dart';

/// Re-runs the router redirect whenever the sign-in state changes.
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Ref ref) {
    ref.listen(authProvider, (_, _) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = _AuthListenable(ref);
  return GoRouter(
    initialLocation: '/home',
    refreshListenable: refresh,
    redirect: (context, state) {
      final auth = ref.read(authProvider);
      final loc = state.matchedLocation;
      final onAuthPage = loc == '/login' || loc == '/register';
      if (auth.status == AuthStatus.loading) return loc == '/splash' ? null : '/splash';
      if (auth.status == AuthStatus.signedOut) return onAuthPage ? null : '/login';
      if (auth.user != null && !auth.user!.isCandidate) return loc == '/staff' ? null : '/staff';
      if (onAuthPage || loc == '/splash' || loc == '/staff') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const _Splash()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/staff', builder: (_, _) => const _StaffNotice()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => _TabShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/home', builder: (_, _) => const HomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/jobs', builder: (_, _) => const JobsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/resumes', builder: (_, _) => const ResumesScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/consultations', builder: (_, _) => const ConsultationsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/account', builder: (_, _) => const AccountScreen())]),
        ],
      ),
      // Detail screens open full-screen above the tab bar, with a back arrow.
      GoRoute(path: '/jobs/:id', builder: (_, s) => JobDetailScreen(jobId: s.pathParameters['id']!)),
      GoRoute(path: '/resumes/:id', builder: (_, s) => ResumeDetailScreen(resumeId: s.pathParameters['id']!)),
      GoRoute(path: '/consultations/new', builder: (_, _) => const NewConsultationScreen()),
      GoRoute(path: '/consultations/:id', builder: (_, s) => ConsultationDetailScreen(id: s.pathParameters['id']!)),
    ],
  );
});

class CcvApp extends ConsumerWidget {
  const CcvApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    // Rebuild everything when the language switches; strings use tr().
    return ValueListenableBuilder<bool>(
      valueListenable: AppLanguage.vi,
      builder: (_, vi, _) => MaterialApp.router(
        key: ValueKey(vi),
        title: 'CCV',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(),
        routerConfig: router,
      ),
    );
  }
}

class _TabShell extends StatelessWidget {
  const _TabShell({required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    final tabs = <(IconData, IconData, String)>[
      (Icons.home_outlined, Icons.home, tr('Trang chủ', 'Home')),
      (Icons.work_outline, Icons.work, tr('Việc làm', 'Jobs')),
      (Icons.description_outlined, Icons.description, 'CV'),
      (Icons.forum_outlined, Icons.forum, tr('Tư vấn', 'Advice')),
      (Icons.person_outline, Icons.person, tr('Tài khoản', 'Account')),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(tabs[shell.currentIndex].$3, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500)),
        actions: const [Padding(padding: EdgeInsets.only(right: 16), child: CcvMark(height: 24))],
      ),
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
        destinations: [
          for (final t in tabs) NavigationDestination(icon: Icon(t.$1), selectedIcon: Icon(t.$2), label: t.$3),
        ],
      ),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: CcvMark(height: 40)));
}

/// Consultant and admin accounts keep using the web app for now.
class _StaffNotice extends ConsumerWidget {
  const _StaffNotice();

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const CcvMark(),
              const Spacer(),
              Text(tr('App dành cho ứng viên', 'This app is for candidates'),
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w500)),
              const SizedBox(height: 8),
              Text(
                tr('Tài khoản cố vấn và quản trị dùng bản web để làm việc.',
                    'Consultant and admin accounts work on the web app.'),
                style: const TextStyle(fontSize: 15, height: 1.5, color: AppColors.muted),
              ),
              const Spacer(),
              BigButton(label: tr('Đăng xuất', 'Sign out'), onPressed: () => ref.read(authProvider.notifier).logout()),
            ]),
          ),
        ),
      );
}
