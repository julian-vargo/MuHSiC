library(tidyverse)
library(readr)
library(stringr)

df <- read_tsv("C:/Users/julia/research/muhsic_spreadsheets/muhsic_cleaned_metadata.tsv")

df <- df %>% select(-145:-175)
df <- df %>% select(-2:-3)
df <- df %>% select(-Name, -"Automating Dominance")

df <- df %>% droplevels()

write.table(
  df,
  file = "C:/Users/julia/research/muhsic_spreadsheets/muhsic_public_metadata.csv",
  sep = ",",
  quote = TRUE,
  row.names = FALSE,
  col.names = TRUE,
  fileEncoding = "UTF-8"
)