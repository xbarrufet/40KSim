use clap::Parser;

#[derive(Parser)]
#[command(name = "rust-sim", about = "Warhammer 40K combat simulator")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(clap::Subcommand)]
enum Command {
    /// List factions from Supabase
    Factions,
    /// List units for a faction
    Units {
        /// Faction slug (e.g. "space-marines")
        faction: String,
    },
    /// Run a test simulation
    Simulate {
        /// Attacker faction slug
        #[arg(long)]
        attacker_faction: String,
        /// Attacker unit slug
        #[arg(long)]
        attacker_unit: String,
        /// Defender faction slug
        #[arg(long)]
        defender_faction: String,
        /// Defender unit slug
        #[arg(long)]
        defender_unit: String,
        /// Range in inches
        #[arg(long, default_value = "12")]
        range: u32,
        /// Number of iterations
        #[arg(long, default_value = "1000")]
        iterations: u32,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::Factions => {
            todo!()
        }
        Command::Units { faction: _ } => {
            todo!()
        }
        Command::Simulate {
            attacker_faction: _,
            attacker_unit: _,
            defender_faction: _,
            defender_unit: _,
            range: _,
            iterations: _,
        } => {
            todo!()
        }
    }
}
