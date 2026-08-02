# HRAI Job Match Model

The live application currently uses `explainable-job-match-v1`. It keeps every
criterion visible and does not load the dummy `.joblib` files from the supplied
prototype.

The Hugging Face dataset `nonameee12233/job-resume-matching` is suitable for a
future **job-resume pair matching** model because its labels describe a CV's
fit for a specific job. It must not be used as an intrinsic candidate-quality
label.

## Training gate

1. Split by `candidate_id` and `job_id`, not random rows, to prevent leakage.
2. Train only on job-related evidence: skill overlap, experience fit,
   education fit, language fit and semantic CV-job similarity.
3. Exclude names, gender signals, photos, age, address and other protected or
   proxy attributes.
4. Compare the model against `explainable-job-match-v1` with NDCG@10,
   Spearman correlation and subgroup error checks.
5. Export a versioned artifact with dataset hash, feature schema and metrics.
6. Enable it behind a feature flag only after human review; always return the
   visible criterion breakdown alongside the learned score.

`CV Profil Kalitesi` remains a separate document-completeness score and is
never trained from `final_score` in this dataset.
