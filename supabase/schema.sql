-- ============================================================
-- IKAI ATS System - Supabase PostgreSQL Schema
-- Tüm string veriler lowercase constraint ile kaydedilir.
-- Yetkinlikler, diller, projeler JSONB formatında tutulur.
-- ============================================================

-- 1. EXTENSION: UUID desteği
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. PUANLAMA AĞIRLIKLARI (Scoring Weights)
-- ============================================================
CREATE TABLE scoring_weights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_weight INTEGER NOT NULL DEFAULT 40 CHECK (skill_weight >= 0 AND skill_weight <= 100),
    project_weight INTEGER NOT NULL DEFAULT 20 CHECK (project_weight >= 0 AND project_weight <= 100),
    llm_summary_weight INTEGER NOT NULL DEFAULT 20 CHECK (llm_summary_weight >= 0 AND llm_summary_weight <= 100),
    university_weight INTEGER NOT NULL DEFAULT 10 CHECK (university_weight >= 0 AND university_weight <= 100),
    language_weight INTEGER NOT NULL DEFAULT 10 CHECK (language_weight >= 0 AND language_weight <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT total_weight_check CHECK (
        skill_weight + project_weight + llm_summary_weight + university_weight + language_weight = 100
    )
);

-- Varsayılan ağırlık kaydı
INSERT INTO scoring_weights (skill_weight, project_weight, llm_summary_weight, university_weight, language_weight)
VALUES (40, 20, 20, 10, 10);

-- ============================================================
-- 3. ADAYLAR / CV'LER (Candidates)
-- ============================================================
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Temel Bilgiler
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Meslek / Pozisyon (lowercase)
    profession VARCHAR(255),

    -- Eğitim bölümü / uzmanlık alanı
    department VARCHAR(255),
    
    -- Üniversite (lowercase)
    university VARCHAR(255),

    -- Konum ve profesyonel bağlantılar
    location VARCHAR(255),
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    
    -- Deneyim yılı
    experience_years INTEGER DEFAULT 0,
    
    -- JSONB Alanları (lowercase olarak kaydedilir)
    -- skills: ["python", "java", "sql", "docker", "git"]
    skills JSONB DEFAULT '[]'::jsonb,
    
    -- languages: [{"language": "ingilizce", "level": "b2"}, {"language": "almanca", "level": "a2"}]
    languages JSONB DEFAULT '[]'::jsonb,

    -- certifications: [{"name": "...", "issuer": "...", "year": "2025"}]
    certifications JSONB DEFAULT '[]'::jsonb,
    
    -- projects: [{"title": "e-commerce api", "description": "...", "technologies": ["python", "fastapi"]}]
    projects JSONB DEFAULT '[]'::jsonb,
    
    -- AI tarafından üretilen özet
    ai_summary TEXT,
    
    -- Ham CV metni (OCR çıktısı)
    raw_cv_text TEXT,
    
    -- Orijinal PDF dosya adı
    original_filename VARCHAR(500),

    -- Aday kartında gösterilen 6 eksenli kalıcı radar skorları
    radar_scores JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Gerçek OCR/LLM hattının sağlayıcı, model ve çalışma durumu
    analysis_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Durum: pending (onay bekleyen), approved (onaylanan), rejected (reddedilen)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lowercase trigger fonksiyonu
CREATE OR REPLACE FUNCTION lowercase_candidate_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_name := LOWER(NEW.full_name);
    NEW.profession := LOWER(NEW.profession);
    NEW.university := LOWER(NEW.university);
    NEW.email := LOWER(NEW.email);
    
    -- Skills dizisini lowercase yap
    IF NEW.skills IS NOT NULL AND jsonb_typeof(NEW.skills) = 'array' THEN
        SELECT jsonb_agg(LOWER(elem::text)::jsonb #>> '{}')
        INTO NEW.skills
        FROM jsonb_array_elements_text(NEW.skills) AS elem;
        -- Tekrar jsonb dizisine çevir
        SELECT jsonb_agg(elem)
        INTO NEW.skills
        FROM (
            SELECT LOWER(value)::text AS elem
            FROM jsonb_array_elements_text(NEW.skills) AS value
        ) sub;
        -- Düzelt: text'leri jsonb string'e çevir
        NEW.skills := (
            SELECT jsonb_agg(to_jsonb(LOWER(elem)))
            FROM jsonb_array_elements_text(NEW.skills) AS elem
        );
    END IF;
    
    -- Languages dizisindeki language alanlarını lowercase yap
    IF NEW.languages IS NOT NULL AND jsonb_typeof(NEW.languages) = 'array' THEN
        NEW.languages := (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'language', LOWER(lang->>'language'),
                    'level', LOWER(lang->>'level')
                )
            )
            FROM jsonb_array_elements(NEW.languages) AS lang
        );
    END IF;
    
    -- Projects dizisindeki title ve technologies lowercase
    IF NEW.projects IS NOT NULL AND jsonb_typeof(NEW.projects) = 'array' THEN
        NEW.projects := (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'title', LOWER(proj->>'title'),
                    'description', proj->>'description',
                    'technologies', (
                        SELECT COALESCE(jsonb_agg(to_jsonb(LOWER(tech))), '[]'::jsonb)
                        FROM jsonb_array_elements_text(proj->'technologies') AS tech
                    )
                )
            )
            FROM jsonb_array_elements(NEW.projects) AS proj
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lowercase_candidate
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION lowercase_candidate_fields();

-- İndeksler
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_profession ON candidates(profession);
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_languages ON candidates USING GIN(languages);

-- ============================================================
-- 4. MÜLAKATLAR (Interviews)
-- ============================================================
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    
    -- Mülakat bilgileri
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    position VARCHAR(255),
    
    -- Durum: pending, approved, rejected
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Gerçekleşme durumu: null (henüz belirlenmedi), true (gerçekleşti), false (gerçekleşmedi)
    is_completed BOOLEAN,
    
    -- Mülakat notları
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_date ON interviews(interview_date);

-- ============================================================
-- 5. MÜLAKAT ASİSTANI KAYITLARI (Transcripts and analyses)
-- ============================================================
CREATE TABLE interview_transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    transcript TEXT NOT NULL,
    summary TEXT NOT NULL,
    general_evaluation TEXT NOT NULL,
    analysis_mode VARCHAR(10) NOT NULL DEFAULT 'demo' CHECK (analysis_mode IN ('demo', 'llm')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interview_transcripts_candidate ON interview_transcripts(candidate_id);
CREATE INDEX idx_interview_transcripts_interview ON interview_transcripts(interview_id);

-- ============================================================
-- 6. RAPORLAR (Reports)
-- ============================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Rapor başlığı
    title VARCHAR(500) NOT NULL,
    
    -- Aranan pozisyon
    position VARCHAR(255),
    
    -- Filtreleme kriterleri (JSONB)
    -- {"skills": ["python"], "languages": [{"language": "ingilizce", "level": "b2"}], "university": "odtü"}
    filter_criteria JSONB DEFAULT '{}'::jsonb,
    
    -- Eşleşen adaylar ve skorları (JSONB)
    -- [{"candidate_id": "uuid", "score": 92, "breakdown": {...}, "ai_comment": "..."}]
    matched_candidates JSONB DEFAULT '[]'::jsonb,
    
    -- AI genel yorum
    ai_summary TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. CHATBOT GEÇMİŞİ (Chat History)
-- ============================================================
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Kullanıcı mesajı
    user_message TEXT NOT NULL,
    
    -- AI cevabı
    ai_response TEXT NOT NULL,
    
    -- Oluşturulan SQL sorgusu (varsa)
    generated_sql TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. UPDATED_AT TRİGGER'I
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_scoring_weights_updated_at
    BEFORE UPDATE ON scoring_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
