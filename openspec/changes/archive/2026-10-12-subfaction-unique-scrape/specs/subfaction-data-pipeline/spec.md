# Spec Delta

## Purpose

Defines the convention and tooling for scraping, processing, and storing only the unique units of a subfaction, inheriting shared unit data from a parent faction.

## ADDED Requirements

### Requirement: Parent-Aware Datasheet Scraping

The `fetch_datasheets.py` script SHALL accept a `--skip-parent <parent-slug>` flag. When provided, units whose slug already has a BaseData file in `data/<parent-slug>/BaseData/` SHALL be skipped.

#### Scenario: Scraping only unique units
- **WHEN** the user runs `fetch_datasheets.py "Imperial Fists" --skip-parent space-marines`
- **THEN** the scraper SHALL skip all units that already have a `.json` file in `data/space-marines/BaseData/` and only download datasheets for units unique to Imperial Fists

#### Scenario: Scraping without skip-parent
- **WHEN** the user runs `fetch_datasheets.py "Imperial Fists"` without `--skip-parent`
- **THEN** all units SHALL be scraped as before (backwards compatible)

### Requirement: Subfaction Data Directory Convention

A subfaction's `BaseData/` directory SHALL contain only the datasheets for units unique to that subfaction. Shared units' data SHALL be stored exclusively in the parent faction's directory.

#### Scenario: Imperial Fists directory structure
- **WHEN** Imperial Fists BaseData has been scraped with `--skip-parent space-marines`
- **THEN** `data/imperial-fists/BaseData/` SHALL contain only `tor-garadon.json` and `darnath-lysander.json`
