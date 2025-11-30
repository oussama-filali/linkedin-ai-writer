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
