# Components

## Schichten

- `src/components/website`: öffentliche UI
- `src/components/admin`: Admin-UI
- `src/components/common`: bereichsübergreifende UI

## Öffentliche Kernkomponenten

- Header
  - `Header`
  - `Navigation`
  - `NavigationItem`
  - `DropdownMenu`
- Footer
  - `Footer` (dynamisch über `club_settings`/`pages`)
- Hero-Bereiche
  - Home-Hero
  - Team-Hero (`TeamHero`)
- Cards
  - `NewsCard`
  - `EventCard`
  - `SponsorCard`
  - `DepartmentPersonCard`
  - `TeamPlayerCard`
- Department-Komponenten
  - `DepartmentPageLayout`
  - `DepartmentPersonGrid`
  - `DepartmentPersonCard`
- Team-Komponenten
  - `TeamIntroCard`
  - `TeamInfoGrid`
  - `TeamTrainingInfo`
  - `TeamContact`
  - `TeamDetailTabs`
  - `TeamPlayerSection`
  - `TeamTable`
- Sponsor-Komponenten
  - `SponsorTabs`
  - `SponsorSection`
  - `SponsorGrid`
  - `SponsorBanner`
  - `SponsorActions`
- Membership-Komponenten
  - `MembershipRequestForm`
  - `MembershipPersonalData`
  - `MembershipFootballData`
  - `MembershipPrivacySection`
  - `MembershipSuccessCard`

## Admin Shared-Komponenten (Konsolidierung)

- `AdminToolbar`
- `AdminSaveBar`
- `AdminEmptyState`
- `AdminSelectionList`
- gemeinsame Admin-Form- und Hook-Bausteine in `src/components/admin/*`

## Komponentenprinzipien

- mobile-first Layoutregeln
- möglichst modulnahe Logik, geteilte UI separat
- keine Feature-Änderung bei reinem Refactoring
