pub mod models;

use anyhow::Result;

use models::*;

pub struct SupabaseClient {
    client: reqwest::Client,
    base_url: String,
    api_key: String,
}

impl SupabaseClient {
    /// Creates a client from SUPABASE_URL and SUPABASE_ANON_KEY env vars.
    pub fn from_env() -> Result<Self> {
        todo!()
    }

    pub async fn get_factions(&self) -> Result<Vec<FactionRow>> {
        todo!()
    }

    pub async fn get_units(&self, faction_slug: &str) -> Result<Vec<UnitRow>> {
        todo!()
    }

    pub async fn get_base_data(&self, faction_slug: &str, unit_slug: &str) -> Result<Option<BaseDataRow>> {
        todo!()
    }

    pub async fn get_unit_data(&self, faction_slug: &str, unit_slug: &str) -> Result<Option<UnitDataRow>> {
        todo!()
    }

    pub async fn get_all_base_data(&self, faction_slug: &str) -> Result<Vec<BaseDataRow>> {
        todo!()
    }

    pub async fn get_all_unit_data(&self, faction_slug: &str) -> Result<Vec<UnitDataRow>> {
        todo!()
    }
}
