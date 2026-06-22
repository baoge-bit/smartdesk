/// License validation stub for monetization readiness.
/// Valid keys: `ALPHA-` prefix + at least 16 alphanumeric chars (dev/demo only).

#[derive(serde::Serialize)]
pub struct LicenseStatus {
    pub valid: bool,
    pub tier: String,
    pub message: String,
}

pub fn validate_license_key(key: &str) -> LicenseStatus {
    let trimmed = key.trim();
    if trimmed.is_empty() {
        return LicenseStatus {
            valid: false,
            tier: "free".into(),
            message: "Empty license key".into(),
        };
    }

    let upper = trimmed.to_ascii_uppercase();
    let valid = upper.starts_with("ALPHA-")
        && upper.len() >= 22
        && upper.chars().skip(6).all(|c| c.is_ascii_alphanumeric() || c == '-');

    LicenseStatus {
        valid,
        tier: if valid { "premium".into() } else { "free".into() },
        message: if valid {
            "License activated".into()
        } else {
            "Invalid license key format".into()
        },
    }
}

#[tauri::command]
pub fn validate_license(key: String) -> LicenseStatus {
    validate_license_key(&key)
}