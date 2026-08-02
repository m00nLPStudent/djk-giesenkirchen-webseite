-- B15.16H2 final seed proposal. DO NOT execute automatically.
BEGIN;
INSERT INTO public.news_categories (name_de,slug,sort_order) VALUES ('Allgemein','allgemein',10),('Verein','verein',20),('Fußball','fussball',30),('Tischtennis','tischtennis',40),('Damen-Gymnastik','damen-gymnastik',50),('Testessen','testessen',60),('Sonstiges','sonstiges',70) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.event_types (name_de,slug,sort_order,is_system) VALUES ('Vereinstermin','vereinstermin',10,true),('Training','training',20,true),('Spiel','spiel',30,true),('Turnier','turnier',40,true),('Sonstiges','sonstiges',50,true) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.download_categories (name_de,slug,sort_order) VALUES ('Mitgliedschaft','mitgliedschaft',10),('Formulare','formulare',20),('Satzung','satzung',30),('Beitragsordnung','beitragsordnung',40),('Jugend','jugend',50),('Sonstiges','sonstiges',60) ON CONFLICT (slug) DO NOTHING;
COMMIT;
