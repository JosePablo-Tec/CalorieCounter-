import { supabase } from './supabaseService';
import { FoodItem, FoodTemplate, DailyHistory } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials'))      return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed'))            return 'Debes confirmar tu correo antes de iniciar sesión.';
  if (m.includes('user already registered'))        return 'Este correo ya está registrado.';
  if (m.includes('password should be at least'))    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('unable to validate email'))       return 'Dirección de correo inválida.';
  if (m.includes('email rate limit exceeded'))      return 'Demasiados intentos. Espera unos minutos.';
  return msg;
}

let cachedUid: string | null = null;

async function getUserId(): Promise<string | null> {
  if (cachedUid) return cachedUid;
  const { data: { session } } = await supabase.auth.getSession();
  cachedUid = session?.user?.id ?? null;
  return cachedUid;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { error: translateError(error.message) };
  return {};
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ error?: string; emailNotConfirmed?: boolean }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const emailNotConfirmed = error.message.toLowerCase().includes('email not confirmed');
    return { error: translateError(error.message), emailNotConfirmed };
  }
  return {};
}

export async function signOut(): Promise<void> {
  cachedUid = null;
  await supabase.auth.signOut();
}

export async function resendVerification(
  email: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { error: translateError(error.message) };
  return {};
}

export async function getAuthStatus(): Promise<{ hasSession: boolean; emailVerified: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { hasSession: false, emailVerified: false };
  return { hasSession: true, emailVerified: !!session.user.email_confirmed_at };
}

export function subscribeToAuthChanges(callback: () => void) {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') cachedUid = null;
    callback();
  });
  return data.subscription;
}

// ── Perfil de usuario ─────────────────────────────────────────────────────────

export async function loadProfile(): Promise<{ name: string; dailyGoal: number }> {
  const uid = await getUserId();
  if (!uid) return { name: '', dailyGoal: 2000 };
  const { data } = await supabase
    .from('user_profiles')
    .select('name, daily_goal')
    .eq('id', uid)
    .single();
  return {
    name: data?.name ?? '',
    dailyGoal: data?.daily_goal ?? 2000,
  };
}

export async function saveUserName(name: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;
  await supabase
    .from('user_profiles')
    .upsert({ id: uid, name, updated_at: new Date().toISOString() }, { onConflict: 'id' });
}

export async function saveGoal(goal: number): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;
  await supabase
    .from('user_profiles')
    .upsert({ id: uid, daily_goal: goal, updated_at: new Date().toISOString() }, { onConflict: 'id' });
}

// ── Alimentos del día (operaciones granulares) ────────────────────────────────

export async function loadFoodItems(date: string): Promise<FoodItem[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('food_items')
    .select('id, name, calories, meal')
    .eq('user_id', uid)
    .eq('date', date)
    .order('created_at');
  if (error) {
    console.error('loadFoodItems error:', error);
    return [];
  }
  return (data ?? []) as FoodItem[];
}

export async function insertFoodItem(date: string, item: FoodItem): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;
  const { error } = await supabase.from('food_items').insert({
    id: item.id, user_id: uid, date, name: item.name, calories: item.calories, meal: item.meal,
  });
  if (error) console.error('insertFoodItem error:', error);
}

export async function insertFoodItems(date: string, items: FoodItem[]): Promise<void> {
  const uid = await getUserId();
  if (!uid || items.length === 0) return;
  const { error } = await supabase.from('food_items').insert(
    items.map(i => ({ id: i.id, user_id: uid, date, name: i.name, calories: i.calories, meal: i.meal }))
  );
  if (error) console.error('insertFoodItems error:', error);
}

export async function deleteFoodItemById(id: string): Promise<void> {
  const { error } = await supabase.from('food_items').delete().eq('id', id);
  if (error) console.error('deleteFoodItemById error:', error);
}

// ── Plantillas ────────────────────────────────────────────────────────────────

export async function loadTemplates(): Promise<FoodTemplate[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data } = await supabase
    .from('food_templates')
    .select('id, name, total_calories, template_items(name, calories)')
    .eq('user_id', uid)
    .order('created_at');
  if (!data) return [];
  return data.map(t => ({
    id: t.id as string,
    name: t.name as string,
    totalCalories: t.total_calories as number,
    items: (t.template_items as { name: string; calories: number }[]) ?? [],
  }));
}

export async function saveTemplates(templates: FoodTemplate[]): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  // CASCADE en template_items.template_id borra los ítems hijos automáticamente.
  await supabase.from('food_templates').delete().eq('user_id', uid);
  if (templates.length === 0) return;

  const templateRows = templates.map(t => ({
    id: t.id,
    user_id: uid,
    name: t.name,
    total_calories: t.totalCalories,
  }));
  const { error: tplErr } = await supabase.from('food_templates').insert(templateRows);
  if (tplErr) {
    console.error('saveTemplates templates error:', tplErr);
    return;
  }

  const itemRows = templates.flatMap(t =>
    t.items.map(i => ({ template_id: t.id, name: i.name, calories: i.calories }))
  );
  if (itemRows.length > 0) {
    const { error: itemsErr } = await supabase.from('template_items').insert(itemRows);
    if (itemsErr) console.error('saveTemplates items error:', itemsErr);
  }
}

// ── Historial ─────────────────────────────────────────────────────────────────

export async function loadHistory(currentGoal: number): Promise<DailyHistory[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { data, error } = await supabase.rpc('get_history_totals', {
    cutoff_date: cutoff.toISOString().split('T')[0],
  });

  if (error) {
    console.error('loadHistory error:', error);
    return [];
  }
  if (!data || data.length === 0) return [];

  return (data as { date: string; total_calories: number }[]).map(row => ({
    date: row.date,
    totalCalories: row.total_calories,
    goal: currentGoal,
    items: [],
  }));
}
