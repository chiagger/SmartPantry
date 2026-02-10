export type AppLanguage = "en" | "it";

export type TranslationParams = Record<string, string | number | null | undefined>;

const en = {
  common_back: "Back",
  common_email: "Email",
  common_password: "Password",
  common_name: "Name",
  common_surname: "Surname",
  common_or: "or",
  common_error_prefix: "Error:",

  welcome_intro: "Welcome to",
  welcome_subtitle: "Your AI-powered kitchen & groceries companion.",
  welcome_continue_email: "Continue with email",
  welcome_create_account_email: "Create account with email",
  welcome_continue_google: "Continue with Google",

  login_title: "Login",
  login_welcome_back: "Welcome back",
  login_subtitle: "Sign in with your email and password.",
  login_signing_in: "Signing in...",
  login_sign_in: "Sign in",

  register_title: "Create account",
  register_heading: "Start your SmartPantry journey",
  register_subtitle: "Fill in your details to register with email.",
  register_date_of_birth: "Date of birth (MM/DD/YYYY)",
  register_confirm_password: "Confirm password",
  register_creating: "Creating...",
  register_create_account: "Create account",

  validation_password_required: "Password is required",
  validation_password_min_length: "Password must be at least 8 characters",
  validation_password_uppercase: "Password must include an uppercase letter",
  validation_password_number: "Password must include a number",
  validation_password_special: "Password must include a special character",
  validation_passwords_mismatch: "Passwords do not match",

  settings_title: "Settings",
  settings_subtitle: "Customize your experience.",
  settings_dark_mode: "Dark mode",
  settings_language: "Language",
  settings_language_english: "English",
  settings_language_italian: "Italian",
  settings_logging_out: "Logging out...",
  settings_logout: "Logout",

  tabs_home: "Home",
  tabs_settings: "Settings",

  not_found_stack_title: "Oops!",
  not_found_message: "This screen does not exist.",
  not_found_go_home: "Go to home screen!",

  food_search_placeholder: "Add item to list...",
  food_search_clear_search: "Clear search",

  auth_email_password_required: "Email and password are required",
  auth_invalid_credentials: "Invalid email or password",
  auth_no_account_email: "No account found for this email",
  auth_invalid_email_format: "Invalid email format",
  auth_account_exists:
    "There is already an account linked to this email. Login instead.",
  auth_email_already_registered:
    "Email is already registered. Go back to sign in.",
  auth_all_fields_required: "All fields are required",
  auth_google_error_title: "Error",
  auth_google_error_message:
    "An error occurred during Google login. Please try again later.",

  list_my_list: "My List",
  list_shared_with_id: "Shared: {id}",
  list_current_error: "Current list error: {message}",
  list_past_error: "Past list error: {message}",
  list_shared_default_name: "Shared List",
  list_notice_unique_code: "Could not create a unique invite code. Try again.",
  list_notice_already_shared: "This list is already shared.",
  list_notice_enter_valid_invite: "Enter a valid invite code.",
  list_notice_invite_not_found: "Invite code not found.",
  list_notice_item_already_exists: "\"{label}\" is already in your list",
  list_title_your_lists: "Your Lists",
  list_accessibility_settings: "List settings",
  list_header_shared_list: "Shared list",
  list_header_invite_friend: "Invite friend",
  list_section_groceries: "Groceries List",
  list_section_groceries_meta: "Swipe right if bought",
  list_empty_title: "List empty",
  list_empty_subtitle: "Add your first item below.",
  list_scroll: "Scroll",
  list_section_previous: "Previous Items",
  list_section_previous_meta: "Swipe right to re-add",
  list_previous_empty_title: "No previous items yet",
  list_previous_empty_subtitle: "Swipe right on groceries to send them here.",
  list_notice_not_signed_in: "Not signed in. Lists won't load.",
  list_modal_settings_title: "List settings",
  list_modal_your_lists: "Your lists",
  list_modal_list_name: "List name",
  list_modal_sharing: "Sharing",
  list_modal_currently_shared_with: "Currently shared with",
  list_member_you: "You",
  list_member_generic: "Member",
  list_member_admin: "Admin",
  list_members_none: "No members yet.",
  list_share_methods: "Share methods",
  list_share_invite_link: "Invite link",
  list_share_invite_code: "Invite code: {code}",
  list_copy_code: "Code copied",
  list_copy_link: "Link copied",
  list_leave_list: "Leave list",
  list_private: "This list is private.",
  list_make_shareable: "Make shareable",
  list_delete_list: "Delete list",
  list_setup_title: "Create or join a list",
  list_setup_subtitle: "You need a list before you can add items.",
  list_setup_new_list_name: "New list name",
  list_setup_default_list_name: "My List",
  list_setup_create_list: "Create list",
  list_setup_join_with_code: "Join with code",
  list_setup_invite_code: "Invite code",
  list_setup_join: "Join",
} as const;

type TranslationKey = keyof typeof en;
type TranslationDictionary = Record<TranslationKey, string>;

const it: TranslationDictionary = {
  common_back: "Indietro",
  common_email: "Email",
  common_password: "Password",
  common_name: "Nome",
  common_surname: "Cognome",
  common_or: "oppure",
  common_error_prefix: "Errore:",

  welcome_intro: "Benvenuto su",
  welcome_subtitle: "Il tuo assistente AI per cucina e spesa.",
  welcome_continue_email: "Continua con email",
  welcome_create_account_email: "Crea account con email",
  welcome_continue_google: "Continua con Google",

  login_title: "Accesso",
  login_welcome_back: "Bentornato",
  login_subtitle: "Accedi con email e password.",
  login_signing_in: "Accesso in corso...",
  login_sign_in: "Accedi",

  register_title: "Crea account",
  register_heading: "Inizia il tuo percorso con SmartPantry",
  register_subtitle: "Inserisci i tuoi dati per registrarti con email.",
  register_date_of_birth: "Data di nascita (GG/MM/AAAA)",
  register_confirm_password: "Conferma password",
  register_creating: "Creazione in corso...",
  register_create_account: "Crea account",

  validation_password_required: "La password e obbligatoria",
  validation_password_min_length:
    "La password deve avere almeno 8 caratteri",
  validation_password_uppercase:
    "La password deve includere una lettera maiuscola",
  validation_password_number: "La password deve includere un numero",
  validation_password_special:
    "La password deve includere un carattere speciale",
  validation_passwords_mismatch: "Le password non coincidono",

  settings_title: "Impostazioni",
  settings_subtitle: "Personalizza la tua esperienza.",
  settings_dark_mode: "Modalita scura",
  settings_language: "Lingua",
  settings_language_english: "Inglese",
  settings_language_italian: "Italiano",
  settings_logging_out: "Disconnessione in corso...",
  settings_logout: "Esci",

  tabs_home: "Home",
  tabs_settings: "Impostazioni",

  not_found_stack_title: "Oops!",
  not_found_message: "Questa schermata non esiste.",
  not_found_go_home: "Vai alla home!",

  food_search_placeholder: "Aggiungi un elemento alla lista...",
  food_search_clear_search: "Cancella ricerca",

  auth_email_password_required: "Email e password sono obbligatorie",
  auth_invalid_credentials: "Email o password non valide",
  auth_no_account_email: "Nessun account trovato per questa email",
  auth_invalid_email_format: "Formato email non valido",
  auth_account_exists:
    "Esiste gia un account associato a questa email. Fai il login.",
  auth_email_already_registered:
    "L'email e gia registrata. Torna indietro per accedere.",
  auth_all_fields_required: "Tutti i campi sono obbligatori",
  auth_google_error_title: "Errore",
  auth_google_error_message:
    "Si e verificato un errore durante il login con Google. Riprova piu tardi.",

  list_my_list: "La mia lista",
  list_shared_with_id: "Condivisa: {id}",
  list_current_error: "Errore lista corrente: {message}",
  list_past_error: "Errore lista passata: {message}",
  list_shared_default_name: "Lista condivisa",
  list_notice_unique_code:
    "Impossibile creare un codice invito univoco. Riprova.",
  list_notice_already_shared: "Questa lista e gia condivisa.",
  list_notice_enter_valid_invite: "Inserisci un codice invito valido.",
  list_notice_invite_not_found: "Codice invito non trovato.",
  list_notice_item_already_exists: "\"{label}\" e gia nella tua lista",
  list_title_your_lists: "Le tue liste",
  list_accessibility_settings: "Impostazioni lista",
  list_header_shared_list: "Lista condivisa",
  list_header_invite_friend: "Invita un amico",
  list_section_groceries: "Lista della spesa",
  list_section_groceries_meta: "Scorri a destra se comprato",
  list_empty_title: "Lista vuota",
  list_empty_subtitle: "Aggiungi il tuo primo elemento qui sotto.",
  list_scroll: "Scorri",
  list_section_previous: "Elementi precedenti",
  list_section_previous_meta: "Scorri a destra per riaggiungere",
  list_previous_empty_title: "Nessun elemento precedente",
  list_previous_empty_subtitle:
    "Scorri a destra sugli elementi per inviarli qui.",
  list_notice_not_signed_in: "Non hai effettuato l'accesso. Le liste non si caricano.",
  list_modal_settings_title: "Impostazioni lista",
  list_modal_your_lists: "Le tue liste",
  list_modal_list_name: "Nome lista",
  list_modal_sharing: "Condivisione",
  list_modal_currently_shared_with: "Attualmente condivisa con",
  list_member_you: "Tu",
  list_member_generic: "Membro",
  list_member_admin: "Admin",
  list_members_none: "Nessun membro.",
  list_share_methods: "Metodi di condivisione",
  list_share_invite_link: "Link invito",
  list_share_invite_code: "Codice invito: {code}",
  list_copy_code: "Codice copiato",
  list_copy_link: "Link copiato",
  list_leave_list: "Esci dalla lista",
  list_private: "Questa lista e privata.",
  list_make_shareable: "Rendi condivisibile",
  list_delete_list: "Elimina lista",
  list_setup_title: "Crea o entra in una lista",
  list_setup_subtitle: "Serve una lista prima di poter aggiungere elementi.",
  list_setup_new_list_name: "Nome nuova lista",
  list_setup_default_list_name: "La mia lista",
  list_setup_create_list: "Crea lista",
  list_setup_join_with_code: "Entra con codice",
  list_setup_invite_code: "Codice invito",
  list_setup_join: "Entra",
};

const translations: Record<AppLanguage, TranslationDictionary> = {
  en,
  it,
};

export type { TranslationKey };

function interpolate(template: string, params: TranslationParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function detectSystemLanguage(locale?: string): AppLanguage {
  const fallbackLocale = Intl.DateTimeFormat().resolvedOptions().locale || "en";
  const normalized = (locale || fallbackLocale).toLowerCase();
  return normalized.startsWith("it") ? "it" : "en";
}

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const template = translations[language][key] ?? translations.en[key];
  return interpolate(template, params);
}
