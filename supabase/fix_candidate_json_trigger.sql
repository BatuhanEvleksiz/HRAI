-- Run once in Supabase SQL Editor for an existing project.
-- The original trigger attempted to cast plain text such as "python" to JSON.
CREATE OR REPLACE FUNCTION lowercase_candidate_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_name := LOWER(NEW.full_name);
    NEW.profession := LOWER(NEW.profession);
    NEW.university := LOWER(NEW.university);
    NEW.email := LOWER(NEW.email);

    IF NEW.skills IS NOT NULL AND jsonb_typeof(NEW.skills) = 'array' THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(LOWER(value))), '[]'::jsonb)
        INTO NEW.skills
        FROM jsonb_array_elements_text(NEW.skills) AS item(value);
    END IF;

    IF NEW.languages IS NOT NULL AND jsonb_typeof(NEW.languages) = 'array' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'language', LOWER(COALESCE(lang->>'language', '')),
                'level', LOWER(COALESCE(lang->>'level', ''))
            )
        ), '[]'::jsonb)
        INTO NEW.languages
        FROM jsonb_array_elements(NEW.languages) AS item(lang);
    END IF;

    IF NEW.projects IS NOT NULL AND jsonb_typeof(NEW.projects) = 'array' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'title', LOWER(COALESCE(project->>'title', '')),
                'description', project->>'description',
                'technologies', CASE
                    WHEN jsonb_typeof(project->'technologies') = 'array' THEN (
                        SELECT COALESCE(jsonb_agg(to_jsonb(LOWER(tech))), '[]'::jsonb)
                        FROM jsonb_array_elements_text(project->'technologies') AS item(tech)
                    )
                    WHEN jsonb_typeof(project->'technologies') = 'string' THEN
                        jsonb_build_array(LOWER(project->>'technologies'))
                    ELSE '[]'::jsonb
                END
            )
        ), '[]'::jsonb)
        INTO NEW.projects
        FROM jsonb_array_elements(NEW.projects) AS item(project);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
