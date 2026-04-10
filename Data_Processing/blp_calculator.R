# Multilingual Hispanic Speech in California BLP Calculator

# Written by Julian Vargo
# Department of Spanish & Portuguese - UC Berkeley

# Corpus Citation: Amengual, M. Kim, J. Y., Davidson, J., & Vargo, J. (2026).
# Multilingual Hispanic Speech in California. [Corpus]. University of California.

library(dplyr); library(readr); library(ggplot2); library(stringr); library(tidyr); library(arrow)

df <- read_csv("E:/full_muhsic_corpus/metadata.csv")

# Language history subscore
df <- df %>% mutate(
  interviewee_english_history_subscore = rowMeans(
    select(.,
      interviewee_start_learning_english,
      interviewee_feel_comfortable_english,
      interviewee_class_years_english,
      interviewee_region_years_english,
      interviewee_family_years_english,
      interviewee_work_years_english
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  ),

  interviewee_spanish_history_subscore = rowMeans(
    select(.,
      interviewee_start_learning_spanish,
      interviewee_feel_comfortable_spanish,
      interviewee_class_years_spanish,
      interviewee_region_years_spanish,
      interviewee_family_years_spanish,
      interviewee_work_years_spanish
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  )
) %>% mutate(
  interviewee_language_history_subscore = interviewee_english_history_subscore - interviewee_spanish_history_subscore
)

# Language use subscore
df <- df %>% mutate(
  interviewee_english_language_use_subscore = rowMeans(
    select(.,
      interviewee_friends_percentage_english,
      interviewee_family_percentage_english,
      interviewee_school_work_percentage_english,
      interviewee_talk_yourself_percentage_english,
      interviewee_count_percentage_english
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  ),

  interviewee_spanish_language_use_subscore = rowMeans(
    select(.,
      interviewee_friends_percentage_spanish,
      interviewee_family_percentage_spanish,
      interviewee_school_work_percentage_spanish,
      interviewee_talk_yourself_percentage_spanish,
      interviewee_count_percentage_spanish
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  )
) %>% mutate(
  interviewee_language_use_subscore = interviewee_english_language_use_subscore - interviewee_spanish_language_use_subscore
)

# Language proficiency subscore
df <- df %>% mutate(
  interviewee_english_language_proficiency_subscore = rowMeans(
    select(.,
      interviewee_speak_proficiency_english,
      interviewee_understand_proficiency_english,
      interviewee_read_proficiency_english,
      interviewee_write_proficiency_english
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  ),

  interviewee_spanish_language_proficiency_subscore = rowMeans(
    select(.,
      interviewee_speak_proficiency_spanish,
      interviewee_understand_proficiency_spanish,
      interviewee_read_proficiency_spanish,
      interviewee_write_proficiency_spanish
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  )
) %>% mutate(
  interviewee_language_proficiency_subscore = interviewee_english_language_proficiency_subscore - interviewee_spanish_language_proficiency_subscore
)

# Language attitudes subscore
df <- df %>% mutate(
  interviewee_english_language_attitudes_subscore = rowMeans(
    select(.,
      interviewee_feel_myself_english,
      interviewee_identify_english_speaking_culture,
      interviewee_english_nativespeaker,
      interviewee_others_nativespeaker_english
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  ),

  interviewee_spanish_language_attitudes_subscore = rowMeans(
    select(.,
      interviewee_feel_myself_spanish,
      interviewee_identify_spanish_speaking_culture,
      interviewee_spanish_nativespeaker,
      interviewee_others_nativespeaker_spanish
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  )
) %>% mutate(
  interviewee_language_attitudes_subscore = interviewee_english_language_attitudes_subscore - interviewee_spanish_language_attitudes_subscore
)

# Global BLP Calculation
# History maximally ranges between -20 and 20
# Language use between -100 and 100
# Proficiency between -6 and 6
# Attitudes between -6 and 6

# We weight each category evenly
# Then we scale the BLP to operate on the -218 to 218 scale
# This makes the present BLP score comparable to previous studies
df <- df %>% mutate(
  interviewee_language_history_subscore_weighted = interviewee_language_history_subscore / 20,
  interviewee_language_use_subscore_weighted = interviewee_language_use_subscore / 100,
  interviewee_language_proficiency_subscore_weighted = interviewee_language_proficiency_subscore / 6,
  interviewee_language_attitudes_subscore_weighted = interviewee_language_attitudes_subscore / 6
  )

df <- df %>% mutate(interviewee_global_blp_score = rowMeans(
    select(.,
      interviewee_language_history_subscore_weighted,
      interviewee_language_use_subscore_weighted,
      interviewee_language_proficiency_subscore_weighted,
      interviewee_language_attitudes_subscore_weighted
    ) %>%
      mutate(across(everything(), ~ as.numeric(as.character(.)))),
    na.rm = TRUE
  )) %>% mutate(interviewee_global_blp_score = interviewee_global_blp_score * 218)

blp_theme <- theme_minimal() +
  theme(
    text = element_text(color = "#003c6c"),
    axis.text = element_text(color = "#003c6c"),
    axis.title = element_text(color = "#003c6c"),
    plot.title = element_text(color = "#003c6c")
  )

blp_geom <- geom_histogram(bins = 30, fill = "#003c6c", color = "#003c6c")

ggplot(df, aes(x = interviewee_global_blp_score)) +
  blp_geom +
  labs(
    title = "Histogram of Global BLP Score",
    x = "Score (Negative = Spanish dominant, Positive = English dominant)",
    y = "Number of Speakers"
  ) +
  blp_theme

ggplot(df, aes(x = interviewee_language_history_subscore_weighted)) +
  blp_geom +
  labs(
    title = "Histogram of Language History BLP Subscore",
    x = "Score (Negative = longer overall Spanish history, Positive = longer English history)",
    y = "Number of Speakers"
  ) +
  blp_theme

ggplot(df, aes(x = interviewee_language_use_subscore_weighted)) +
  blp_geom +
  labs(
    title = "Histogram of Language Use BLP Subscore",
    x = "Score (Negative = more Spanish use, Positive = more English use)",
    y = "Number of Speakers"
  ) +
  blp_theme

ggplot(df, aes(x = interviewee_language_proficiency_subscore_weighted)) +
  blp_geom +
  labs(
    title = "Histogram of Language Proficiency BLP Subscore",
    x = "Score (Negative = Spanish dominant, Positive = English dominant)",
    y = "Number of Speakers"
  ) +
  blp_theme

ggplot(df, aes(x = interviewee_language_attitudes_subscore_weighted)) +
  blp_geom +
  labs(
    title = "Histogram of Language Attitudes BLP Subscore",
    x = "Score (Negative = Spanish-identifying attitude, Positive = English-identifying attitude)",
    y = "Number of Speakers"
  ) +
  blp_theme