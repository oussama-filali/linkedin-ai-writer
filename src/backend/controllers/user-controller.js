const db = require('../../config/database');

const DEFAULT_PREFS = {
  pushEnabled: true,
  autoPostEnabled: false,
  factCheckEnabled: true,
  notifyBeforeDefault: true,
  defaultSlot: null,
};

function mapRow(row) {
  if (!row) return DEFAULT_PREFS;
  return {
    pushEnabled: row.push_enabled,
    autoPostEnabled: row.auto_post_enabled,
    factCheckEnabled: row.fact_check_enabled,
    notifyBeforeDefault: row.notify_before_default,
    defaultSlot: row.default_slot,
  };
}

async function ensurePreferences(userId) {
  const { rows } = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
  if (rows[0]) {
    return rows[0];
  }
  const insert = await db.query(
    `INSERT INTO user_preferences (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId]
  );
  if (insert.rows[0]) {
    return insert.rows[0];
  }
  const retry = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
  return retry.rows[0] || null;
}

exports.getPreferences = async (req, res) => {
  try {
    const prefsRow = await ensurePreferences(req.user.id);
    res.json({ success: true, data: mapRow(prefsRow) });
  } catch (error) {
    console.error('Erreur getPreferences:', error.message);
    res.status(500).json({ success: false, error: 'Impossible de charger les préférences' });
  }
};

/**
 * RGPD — Export des données de l'utilisateur (droit à la portabilité).
 * Renvoie toutes les données personnelles : profil, préférences, posts générés.
 * GET /api/users/export
 */
exports.exportData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, prefs, posts] = await Promise.all([
      db.query('SELECT id, email, name, linkedin_profile, created_at FROM users WHERE id = $1', [userId]),
      db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]),
      db.query(
        'SELECT id, objectif, sujet, post_type, generated_post, hashtags, sources, created_at FROM generations_history WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        profile: user.rows[0] || null,
        preferences: prefs.rows[0] || null,
        posts: posts.rows,
        postsCount: posts.rows.length,
      },
    });
  } catch (error) {
    console.error('Erreur exportData (RGPD):', error.message);
    res.status(500).json({ success: false, error: 'Impossible d\'exporter les données' });
  }
};

/**
 * RGPD — Suppression du compte et de TOUTES les données (droit à l'effacement).
 * Supprime : posts, préférences, mémoire RAG, puis le compte utilisateur.
 * DELETE /api/users/me
 */
exports.deleteAccount = async (req, res) => {
  const userId = req.user.id;
  try {
    // Suppression en cascade explicite (au cas où les FK ne couvrent pas tout).
    await db.query("DELETE FROM rag_chunks WHERE user_id = $1 AND kind = 'memory'", [userId]);
    await db.query('DELETE FROM generations_history WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      message: 'Compte et données supprimés définitivement.',
    });
  } catch (error) {
    console.error('Erreur deleteAccount (RGPD):', error.message);
    res.status(500).json({ success: false, error: 'Impossible de supprimer le compte' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const allowedKeys = ['pushEnabled', 'autoPostEnabled', 'factCheckEnabled', 'notifyBeforeDefault', 'defaultSlot'];
    const patch = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        patch[key] = req.body[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune préférence à mettre à jour' });
    }

    await ensurePreferences(req.user.id);

    await db.query(
      `UPDATE user_preferences SET
         push_enabled = COALESCE($1, push_enabled),
         auto_post_enabled = COALESCE($2, auto_post_enabled),
         fact_check_enabled = COALESCE($3, fact_check_enabled),
         notify_before_default = COALESCE($4, notify_before_default),
         default_slot = COALESCE($5, default_slot),
         updated_at = NOW()
       WHERE user_id = $6`,
      [
        patch.pushEnabled,
        patch.autoPostEnabled,
        patch.factCheckEnabled,
        patch.notifyBeforeDefault,
        patch.defaultSlot,
        req.user.id,
      ]
    );

    const updated = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, data: mapRow(updated.rows[0]) });
  } catch (error) {
    console.error('Erreur updatePreferences:', error.message);
    res.status(500).json({ success: false, error: "Impossible d'enregistrer les préférences" });
  }
};
