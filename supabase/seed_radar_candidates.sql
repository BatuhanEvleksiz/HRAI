-- Ten idempotent sample CV records: 6 computer engineers, 4 civil engineers.
-- Run after add_candidate_radar_scores.sql.
WITH seed (
  full_name, email, phone, profession, university, experience_years,
  skills, languages, projects, ai_summary, original_filename, status, radar_scores
) AS (
  VALUES
  (
    'deniz kara', 'deniz.kara.demo@ikai.dev', '+90 555 700 1001', 'bilgisayar mühendisi', 'odtü', 5,
    '["python","fastapi","postgresql","docker","kubernetes","redis","git","aws"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"c1"}]'::jsonb,
    '[{"title":"ölçeklenebilir ödeme servisi","description":"Yüksek trafikli ödeme API altyapısı","technologies":["python","fastapi","postgresql","redis"]},{"title":"kubernetes gözlemleme","description":"Dağıtık servis izleme platformu","technologies":["kubernetes","prometheus","grafana"]}]'::jsonb,
    'Backend sistemleri, ölçeklenebilir API tasarımı ve bulut dağıtımı alanlarında deneyimli bilgisayar mühendisi.',
    'demo_bilgisayar_01.pdf', 'approved',
    '{"technical_skills":9,"project_experience":8.5,"experience_level":8.5,"language_proficiency":9,"communication_clarity":8,"technical_depth":9}'::jsonb
  ),
  (
    'ece aydın', 'ece.aydin.demo@ikai.dev', '+90 555 700 1002', 'bilgisayar mühendisi', 'boğaziçi üniversitesi', 4,
    '["javascript","typescript","react","next.js","node.js","graphql","git","figma"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"c1"},{"language":"almanca","level":"b1"}]'::jsonb,
    '[{"title":"müşteri deneyimi platformu","description":"Çok kiracılı analitik arayüz","technologies":["react","next.js","typescript"]},{"title":"gerçek zamanlı bildirim","description":"Websocket tabanlı bildirim sistemi","technologies":["node.js","graphql","redis"]}]'::jsonb,
    'Modern web uygulamaları, tasarım sistemleri ve kullanıcı deneyimi odaklı geliştirmede güçlü bilgisayar mühendisi.',
    'demo_bilgisayar_02.pdf', 'approved',
    '{"technical_skills":8.5,"project_experience":8,"experience_level":7.5,"language_proficiency":9.5,"communication_clarity":8.5,"technical_depth":8}'::jsonb
  ),
  (
    'mert yalçın', 'mert.yalcin.demo@ikai.dev', '+90 555 700 1003', 'bilgisayar mühendisi', 'itü', 6,
    '["java","spring boot","microservices","kafka","postgresql","docker","aws","terraform"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"b2"}]'::jsonb,
    '[{"title":"bankacılık olay platformu","description":"Kafka tabanlı finansal olay işleme","technologies":["java","spring boot","kafka"]},{"title":"bulut altyapı otomasyonu","description":"AWS kaynaklarının kodla yönetimi","technologies":["aws","terraform","docker"]}]'::jsonb,
    'Kurumsal Java, mikroservis ve olay güdümlü mimarilerde uzman bilgisayar mühendisi.',
    'demo_bilgisayar_03.pdf', 'pending',
    '{"technical_skills":9,"project_experience":9,"experience_level":10,"language_proficiency":8,"communication_clarity":7.5,"technical_depth":9.5}'::jsonb
  ),
  (
    'selin aras', 'selin.aras.demo@ikai.dev', '+90 555 700 1004', 'bilgisayar mühendisi', 'hacettepe üniversitesi', 3,
    '["python","sql","spark","airflow","kafka","postgresql","docker","git"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"b2"}]'::jsonb,
    '[{"title":"veri kalite hattı","description":"Otomatik veri kalite ve gözlemleme sistemi","technologies":["python","airflow","postgresql"]},{"title":"stream analitik","description":"Gerçek zamanlı veri işleme","technologies":["kafka","spark","python"]}]'::jsonb,
    'Veri mühendisliği, ETL ve gerçek zamanlı analitik alanlarında deneyimli bilgisayar mühendisi.',
    'demo_bilgisayar_04.pdf', 'approved',
    '{"technical_skills":8.5,"project_experience":8,"experience_level":6.5,"language_proficiency":8,"communication_clarity":8,"technical_depth":8.5}'::jsonb
  ),
  (
    'kerem güneş', 'kerem.gunes.demo@ikai.dev', '+90 555 700 1005', 'bilgisayar mühendisi', 'bilkent üniversitesi', 2,
    '["c++","python","pytorch","opencv","linux","git","docker"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"c1"}]'::jsonb,
    '[{"title":"görüntü sınıflandırma","description":"Üretim hattı kusur tespit modeli","technologies":["python","pytorch","opencv"]},{"title":"edge inference","description":"C++ ile düşük gecikmeli çıkarım","technologies":["c++","linux","docker"]}]'::jsonb,
    'Bilgisayarlı görü, makine öğrenmesi ve edge sistemlerine odaklanan bilgisayar mühendisi.',
    'demo_bilgisayar_05.pdf', 'pending',
    '{"technical_skills":8,"project_experience":7.5,"experience_level":5.5,"language_proficiency":9,"communication_clarity":7,"technical_depth":8}'::jsonb
  ),
  (
    'zeynep tekin', 'zeynep.tekin.demo@ikai.dev', '+90 555 700 1006', 'bilgisayar mühendisi', 'ytü', 4,
    '["c#",".net","azure","sql","docker","rabbitmq","git","ci/cd"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"b2"}]'::jsonb,
    '[{"title":"erp entegrasyon servisi","description":"Kurumsal sistem entegrasyonu","technologies":["c#",".net","rabbitmq"]},{"title":"azure dağıtım hattı","description":"Otomatik test ve dağıtım","technologies":["azure","docker","ci/cd"]}]'::jsonb,
    '.NET, kurumsal entegrasyon ve Azure dağıtım süreçlerinde deneyimli bilgisayar mühendisi.',
    'demo_bilgisayar_06.pdf', 'rejected',
    '{"technical_skills":8.5,"project_experience":8,"experience_level":7.5,"language_proficiency":8,"communication_clarity":7.5,"technical_depth":8}'::jsonb
  ),
  (
    'emre aksoy', 'emre.aksoy.demo@ikai.dev', '+90 555 700 2001', 'inşaat mühendisi', 'itü', 7,
    '["sap2000","etabs","revit structure","autocad","tbdy 2018","ts500","betonarme","çelik tasarım"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"b2"}]'::jsonb,
    '[{"title":"yüksek katlı konut","description":"Deprem performans ve taşıyıcı sistem tasarımı","technologies":["etabs","sap2000","tbdy 2018"]},{"title":"çelik endüstri yapısı","description":"Çelik sistem analiz ve detaylandırma","technologies":["sap2000","tekla structures"]}]'::jsonb,
    'Betonarme ve çelik yapıların analiz ve tasarımında deneyimli inşaat mühendisi.',
    'demo_insaat_01.pdf', 'approved',
    '{"technical_skills":9,"project_experience":9,"experience_level":10,"language_proficiency":8,"communication_clarity":8,"technical_depth":9}'::jsonb
  ),
  (
    'irem koç', 'irem.koc.demo@ikai.dev', '+90 555 700 2002', 'inşaat mühendisi', 'odtü', 4,
    '["etabs","sta4cad","idecad","autocad","revit structure","tbdy 2018","metraj","hakediş"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"c1"}]'::jsonb,
    '[{"title":"hastane yapısı","description":"Betonarme uygulama ve koordinasyon projesi","technologies":["etabs","revit structure","autocad"]},{"title":"güçlendirme projesi","description":"Mevcut yapı performans değerlendirmesi","technologies":["sta4cad","tbdy 2018"]}]'::jsonb,
    'Yapısal tasarım, BIM koordinasyonu ve güçlendirme projelerinde çalışan inşaat mühendisi.',
    'demo_insaat_02.pdf', 'approved',
    '{"technical_skills":8.5,"project_experience":8.5,"experience_level":7.5,"language_proficiency":9,"communication_clarity":8.5,"technical_depth":8.5}'::jsonb
  ),
  (
    'burak demir', 'burak.demir.demo@ikai.dev', '+90 555 700 2003', 'inşaat mühendisi', 'yıldız teknik üniversitesi', 3,
    '["autocad","civil 3d","navisworks","primavera p6","metraj","hakediş","altyapı","saha yönetimi"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"b1"}]'::jsonb,
    '[{"title":"şehir içi yol projesi","description":"Altyapı ve saha koordinasyonu","technologies":["civil 3d","autocad","navisworks"]},{"title":"iş programı yönetimi","description":"Kaynak ve zaman planlama","technologies":["primavera p6","metraj"]}]'::jsonb,
    'Altyapı, saha koordinasyonu ve proje planlama alanlarında deneyimli inşaat mühendisi.',
    'demo_insaat_03.pdf', 'pending',
    '{"technical_skills":8,"project_experience":7.5,"experience_level":6.5,"language_proficiency":7,"communication_clarity":7.5,"technical_depth":7.5}'::jsonb
  ),
  (
    'nazlı sarı', 'nazli.sari.demo@ikai.dev', '+90 555 700 2004', 'inşaat mühendisi', 'hacettepe üniversitesi', 2,
    '["revit","autocad","tekla structures","navisworks","bim","metraj","çelik detay","betonarme"]'::jsonb,
    '[{"language":"türkçe","level":"c2"},{"language":"ingilizce","level":"b2"},{"language":"almanca","level":"a2"}]'::jsonb,
    '[{"title":"bim koordinasyon modeli","description":"Disiplinler arası çakışma kontrolü","technologies":["revit","navisworks","bim"]},{"title":"çelik detay modeli","description":"İmalat seviyesinde çelik modelleme","technologies":["tekla structures","autocad"]}]'::jsonb,
    'BIM modelleme, disiplin koordinasyonu ve çelik detaylandırmada gelişen inşaat mühendisi.',
    'demo_insaat_04.pdf', 'pending',
    '{"technical_skills":7.5,"project_experience":7.5,"experience_level":5.5,"language_proficiency":8,"communication_clarity":8,"technical_depth":7.5}'::jsonb
  )
)
INSERT INTO public.candidates (
  full_name, email, phone, profession, university, experience_years,
  skills, languages, projects, ai_summary, original_filename, status, radar_scores
)
SELECT
  seed.full_name, seed.email, seed.phone, seed.profession, seed.university, seed.experience_years,
  seed.skills, seed.languages, seed.projects, seed.ai_summary, seed.original_filename, seed.status, seed.radar_scores
FROM seed
WHERE NOT EXISTS (
  SELECT 1 FROM public.candidates existing WHERE existing.email = seed.email
);
