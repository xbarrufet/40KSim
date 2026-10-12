use serde::{Deserialize, Serialize};

use crate::types::ability::StructuredAbilitiesData;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FactionRow {
    pub slug: String,
    pub name: String,
    pub category: Option<String>,
    pub icon: Option<String>,
    pub unit_count: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnitRow {
    pub faction_slug: String,
    pub slug: String,
    pub name: String,
    pub category: Option<String>,
    pub points: Option<i32>,
    pub keywords: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaseDataRow {
    pub faction_slug: String,
    pub unit_slug: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnitDataRow {
    pub faction_slug: String,
    pub unit_slug: String,
    pub tag: String,
    pub abilities: serde_json::Value,
    pub raw_abilities: serde_json::Value,
    pub base_data_hash: Option<String>,
}

impl UnitDataRow {
    /// Parses the JSON abilities/raw_abilities into StructuredAbilitiesData.
    pub fn parse_abilities(&self) -> anyhow::Result<StructuredAbilitiesData> {
        todo!()
    }
}
