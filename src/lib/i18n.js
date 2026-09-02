/**
 * Bilingual label dictionary — Khmer / English
 * Usage: t("dashboard") returns the label in the current language
 */

export const LABELS = {
  // Nav
  dashboard:        { en: "Dashboard",       km: "ផ្ទាំងគ្រប់គ្រង" },
  pages:            { en: "Pages",           km: "ទំព័រ" },
  staff:            { en: "Staff",           km: "បុគ្គលិក" },
  campaigns:        { en: "Campaigns",       km: "យុទ្ធនាការ" },
  daily_entry:      { en: "Daily Entry",     km: "បញ្ចូលប្រចាំថ្ងៃ" },
  bulk_entry:       { en: "Bulk Entry",      km: "បញ្ចូលច្រើន" },
  reports:          { en: "Reports",         km: "របាយការណ៍" },
  import_export:    { en: "Import / Export", km: "នាំចូល / នាំចេញ" },
  audit_logs:       { en: "Audit Logs",      km: "កំណត់ហេតុ" },
  settings:         { en: "Settings",        km: "ការកំណត់" },
  logout:           { en: "Logout",          km: "ចាកចេញ" },

  // Dashboard
  total_spend:      { en: "Total Spend",     km: "ការចំណាយសរុប" },
  total_visitors:   { en: "Total Visitors",  km: "អ្នកចូលមើលសរុប" },
  total_leads:      { en: "Total Leads",     km: "ឆាតចូលសរុប" },
  accounts_created: { en: "Accounts Created",km: "គណនីដែលបានបើក" },
  conversions:      { en: "Conversions",     km: "អ្នកដាក់ប្រាក់" },
  cost_per_account: { en: "Cost / Account",  km: "តម្លៃ / គណនី" },
  cost_per_conv:    { en: "Cost / Conversion",km: "តម្លៃ / អ្នកដាក់ប្រាក់" },
  conv_rate:        { en: "Conversion Rate", km: "អត្រាការប្តូរ" },
  page_performance: { en: "Page Performance",km: "សមត្ថភាពទំព័រ" },
  staff_performance:{ en: "Staff Performance",km: "សមត្ថភាពបុគ្គលិក" },

  // Filters
  all_pages:        { en: "All Pages",       km: "ទំព័រទាំងអស់" },
  all_staff:        { en: "All Staff",       km: "បុគ្គលិកទាំងអស់" },
  all_campaigns:    { en: "All Campaigns",   km: "យុទ្ធនាការទាំងអស់" },

  // Date presets
  today:            { en: "Today",           km: "ថ្ងៃនេះ" },
  yesterday:        { en: "Yesterday",       km: "ម្សិលមិញ" },
  this_week:        { en: "This Week",       km: "សប្ដាហ៍នេះ" },
  last_week:        { en: "Last Week",       km: "សប្ដាហ៍មុន" },
  this_month:       { en: "This Month",      km: "ខែនេះ" },
  last_month:       { en: "Last Month",      km: "ខែមុន" },
  all_time:         { en: "All Time",        km: "ទាំងអស់" },
  custom:           { en: "Custom",          km: "កំណត់ខ្លួនឯង" },
  from:             { en: "From",            km: "ចាប់ពី" },
  to:               { en: "To",             km: "ដល់" },

  // Table columns
  page:             { en: "Page",            km: "ទំព័រ" },
  name:             { en: "Name",            km: "ឈ្មោះ" },
  platform:         { en: "Platform",        km: "វេទិកា" },
  status:           { en: "Status",          km: "ស្ថានភាព" },
  spend:            { en: "Spend",           km: "ការចំណាយ" },
  impressions:      { en: "Impressions",     km: "ចំនួនបង្ហាញ" },
  reach:            { en: "Reach",           km: "ការឈានដល់" },
  clicks:           { en: "Clicks",          km: "ចំនួនចុច" },
  visitors:         { en: "Visitors",        km: "អ្នកចូលមើល" },
  leads:            { en: "Leads",           km: "ឆាតចូល" },
  accounts:         { en: "Accounts",        km: "គណនី" },
  conv:             { en: "Conv.",           km: "ការប្តូរ" },
  ctr:              { en: "CTR",             km: "CTR" },
  revenue:          { en: "Revenue",         km: "ចំណូល" },
  notes:            { en: "Notes",           km: "កំណត់សម្គាល់" },
  date:             { en: "Date",            km: "កាលបរិច្ឆេទ" },
  actions:          { en: "Actions",         km: "សកម្មភាព" },
  cost_account_abbr:{ en: "Cost/Acct",       km: "តម្លៃ/គណនី" },
  cost_conv_abbr:   { en: "Cost/Conv",       km: "តម្លៃ/ការប្តូរ" },
  conv_rate_abbr:   { en: "Conv Rate",       km: "អត្រាការប្តូរ" },

  // Metrics
  total_spend_label:{ en: "Spend Over Time ($)", km: "ការចំណាយតាមពេលវេលា ($)" },
  conv_over_time:   { en: "Conversions & Accounts Over Time", km: "ការប្តូរ & គណនីតាមពេលវេលា" },

  // Pages page
  add_page:         { en: "Add Page",        km: "បន្ថែមទំព័រ" },
  edit_page:        { en: "Edit Page",       km: "កែប្រែទំព័រ" },
  delete_page:      { en: "Delete",          km: "លុប" },
  page_name:        { en: "Page Name",       km: "ឈ្មោះទំព័រ" },
  assigned_staff:   { en: "Assigned Staff",  km: "បុគ្គលិកដែលបានចាត់តាំង" },
  unassigned:       { en: "Unassigned",      km: "មិនទាន់ចាត់តាំង" },
  target_spend:     { en: "Target Spend/day ($)", km: "គោលដៅចំណាយ/ថ្ងៃ ($)" },
  target_conv:      { en: "Target Conv/day", km: "គោលដៅការប្តូរ/ថ្ងៃ" },
  target_cost_conv: { en: "Target Cost/Conv ($)", km: "គោលដៅតម្លៃ/ការប្តូរ ($)" },
  assignment_history:{ en: "Assignment History", km: "ប្រវត្តិការចាត់តាំង" },
  entries:          { en: "Entries",         km: "ការបញ្ចូល" },
  add_entry:        { en: "Add Entry",       km: "បន្ថែមការបញ្ចូល" },
  no_entries:       { en: "No entries yet",  km: "មិនទាន់មានការបញ្ចូល" },
  current:          { en: "Current",         km: "បច្ចុប្បន្ន" },

  // Staff
  add_staff:        { en: "Add Staff",       km: "បន្ថែមបុគ្គលិក" },
  edit_staff:       { en: "Edit Staff Member", km: "កែប្រែបុគ្គលិក" },
  full_name:        { en: "Full Name",       km: "ឈ្មោះពេញ" },
  username:         { en: "Username",        km: "ឈ្មោះអ្នកប្រើ" },
  role:             { en: "Role",            km: "តួនាទី" },
  password:         { en: "Password",        km: "លេខសម្ងាត់" },
  last_login:       { en: "Last Login",      km: "ចូលចុងក្រោយ" },
  never:            { en: "Never",           km: "មិនធ្លាប់" },
  deactivate:       { en: "Deactivate",      km: "បិទដំណើរការ" },

  // Campaigns
  new_campaign:     { en: "New Campaign",    km: "យុទ្ធនាការថ្មី" },
  campaign_name:    { en: "Campaign Name",   km: "ឈ្មោះយុទ្ធនាការ" },
  start_date:       { en: "Start Date",      km: "ថ្ងៃចាប់ផ្ដើម" },
  end_date:         { en: "End Date",        km: "ថ្ងៃបញ្ចប់" },

  // Entry form
  advertising:      { en: "Advertising",     km: "ការផ្សព្វផ្សាយ" },
  funnel:           { en: "Conversion Funnel", km: "ដំណើរការប្តូរ" },
  campaign_optional:{ en: "Campaign (optional)", km: "យុទ្ធនាការ (ស្រេចចិត្ត)" },
  auto_sync:        { en: "Auto-sync spend", km: "ធ្វើសមកាលកម្មការចំណាយ" },
  review_save:      { en: "Review & Save",   km: "ត្រួតពិនិត្យ & រក្សាទុក" },
  confirm_save:     { en: "Confirm & Save",  km: "បញ្ជាក់ & រក្សាទុក" },
  edit_entry:       { en: "Edit",            km: "ត្រឡប់មកកែ" },
  cancel:           { en: "Cancel",          km: "បោះបង់" },
  save_changes:     { en: "Save Changes",    km: "រក្សាទុក" },
  no_campaign:      { en: "— No campaign —", km: "— គ្មានយុទ្ធនាការ —" },

  // Reports
  group_by:         { en: "Group",           km: "ក្រុម" },
  day:              { en: "day",             km: "ថ្ងៃ" },
  week:             { en: "week",            km: "សប្ដាហ៍" },
  month:            { en: "month",           km: "ខែ" },
  compare:          { en: "⬌ Compare",       km: "⬌ ប្រៀបធៀប" },
  page_breakdown:   { en: "Page Breakdown",  km: "ការបំបែកតាមទំព័រ" },

  // Import/Export
  export_csv:       { en: "Export CSV",      km: "នាំចេញ CSV" },
  download_csv:     { en: "Download CSV",    km: "ទាញយក CSV" },
  backup_restore:   { en: "Backup / Restore", km: "បម្រុងទុក / ស្ដារ" },
  import_csv:       { en: "Import CSV",      km: "នាំចូល CSV" },
  confirm_import:   { en: "Confirm Import",  km: "បញ្ជាក់ការនាំចូល" },
  export_btn:       { en: "Export",          km: "នាំចេញ" },
  restore_btn:      { en: "Restore",         km: "ស្ដារ" },

  // Settings
  fb_tokens:        { en: "Facebook / Meta Ads Tokens", km: "Token Facebook / Meta Ads" },
  add_new_token:    { en: "Add New Token",   km: "បន្ថែម Token ថ្មី" },
  token_name:       { en: "Token name",      km: "ឈ្មោះ Token" },
  account_settings: { en: "Account Settings", km: "ការកំណត់គណនី" },
  logged_in_as:     { en: "Logged in as",    km: "ចូលជា" },
  change_password:  { en: "Change Password", km: "ប្ដូរលេខសម្ងាត់" },
  new_password:     { en: "New Password",    km: "លេខសម្ងាត់ថ្មី" },
  confirm_password: { en: "Confirm Password",km: "បញ្ជាក់លេខសម្ងាត់" },
  save_password:    { en: "Save Password",   km: "រក្សាទុកលេខសម្ងាត់" },

  // Audit
  audit_logs_title: { en: "Audit Logs",      km: "កំណត់ហេតុ" },
  all_actions:      { en: "All Actions",     km: "សកម្មភាពទាំងអស់" },
  all_entities:     { en: "All Entities",    km: "ទិន្នន័យទាំងអស់" },

  // Login
  sign_in:          { en: "Sign in to your account", km: "ចូលទៅក្នុងគណនីរបស់អ្នក" },
  setup_admin:      { en: "Set up your admin account", km: "រៀបចំគណនីអ្នកគ្រប់គ្រង" },
  sign_in_btn:      { en: "Sign In",         km: "ចូល" },
  create_admin:     { en: "Create Admin Account", km: "បង្កើតគណនីអ្នកគ្រប់គ្រង" },
  your_name:        { en: "Your Name",       km: "ឈ្មោះរបស់អ្នក" },
  signing_in:       { en: "Signing in...",   km: "កំពុងចូល..." },

  // Common
  active:           { en: "Active",          km: "សកម្ម" },
  inactive:         { en: "Inactive",        km: "អសកម្ម" },
  paused:           { en: "Paused",          km: "ផ្អាក" },
  archived:         { en: "Archived",        km: "បានរក្សាទុក" },
  completed:        { en: "Completed",       km: "បានបញ្ចប់" },
  ended:            { en: "Ended",           km: "បានបញ្ចប់" },
  admin:            { en: "admin",           km: "អ្នកគ្រប់គ្រង" },
  no_data:          { en: "No data for this period", km: "គ្មានទិន្នន័យសម្រាប់រយៈពេលនេះ" },
  search:           { en: "Search pages...", km: "ស្វែងរកទំព័រ..." },
  pages_count:      { en: "pages",           km: "ទំព័រ" },
  monthly_spend:    { en: "Monthly Spend (last 6 months)", km: "ការចំណាយប្រចាំខែ (6 ខែចុងក្រោយ)" },
  assigned_pages:   { en: "Assigned Pages",  km: "ទំព័រដែលបានចាត់តាំង" },
  no_pages_assigned:{ en: "No pages assigned", km: "គ្មានទំព័រដែលបានចាត់តាំង" },
  daily_trend:      { en: "Daily Trend — Spend vs Conversions", km: "និន្នាការប្រចាំថ្ងៃ — ការចំណាយ vs ការប្តូរ" },
  not_enough_data:  { en: "Not enough data yet", km: "ទិន្នន័យមិនគ្រប់គ្រាន់" },
  select_page:      { en: "Select a Page",   km: "ជ្រើសរើសទំព័រ" },
  enter_data_arrow: { en: "Enter Data →",    km: "បញ្ចូលទិន្នន័យ →" },
  enter_another_day:{ en: "Enter another day", km: "បញ្ចូលថ្ងៃផ្សេង" },
  all_entries_saved:{ en: "All entries saved!", km: "ការបញ្ចូលទាំងអស់ត្រូវបានរក្សាទុក!" },
  bulk_title:       { en: "Bulk Entry",      km: "បញ្ចូលច្រើន" },
  bulk_sub:         { en: "Enter performance data for multiple pages at once", km: "បញ្ចូលទិន្នន័យសម្រាប់ទំព័រច្រើនក្នុងពេលតែមួយ" },
  add_pages_to_enter:{ en: "Add Pages to Enter Data", km: "បន្ថែមទំព័រដើម្បីបញ្ចូលទិន្នន័យ" },
  clear_all:        { en: "Clear All",       km: "លុបទាំងអស់" },
  review_save_all:  { en: "Review & Save All", km: "ត្រួតពិនិត្យ & រក្សាទុកទាំងអស់" },
  confirm_bulk:     { en: "Confirm Bulk Save", km: "បញ្ជាក់ការរក្សាទុកច្រើន" },
  confirm_save_all: { en: "Confirm Save All", km: "បញ្ជាក់រក្សាទុកទាំងអស់" },
  perf_overview:    { en: "Performance overview", km: "ទិដ្ឋភាពទូទៅសមត្ថភាព" },
  analyze:          { en: "Analyze performance across time, pages, and staff", km: "វិភាគសមត្ថភាពតាមពេលវេលា ទំព័រ និងបុគ្គលិក" },
  cost_conv_label:  { en: "Cost / Conversion", km: "តម្លៃ / ការប្តូរ" },
  no_history:       { en: "No assignment history", km: "គ្មានប្រវត្តិការចាត់តាំង" },
  staff_assign_history:{ en: "Staff Assignment History", km: "ប្រវត្តិការចាត់តាំងបុគ្គលិក" },
};

// Fallback if key is missing
export const t = (lang, key) => {
  const entry = LABELS[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
};
