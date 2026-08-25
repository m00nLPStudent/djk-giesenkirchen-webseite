-- B15.19F2 read-only postcheck and legacy inventory. No mutations.
SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='news_documents' AND column_name='media_asset_id';
SELECT conname,contype,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid IN ('public.news_documents'::regclass,'public.media_asset_usages'::regclass) ORDER BY conrelid::regclass::text,conname;
SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='news_documents';
SELECT pg_get_functiondef('public.synchronize_media_assignment(text,uuid,uuid,text)'::regprocedure) AS assignment_rpc;
SELECT pg_get_functiondef('public.cleanup_news_document_media_usage()'::regprocedure) AS cleanup_function;
SELECT tgname,pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid='public.news_documents'::regclass AND NOT tgisinternal;
SELECT has_function_privilege('anon','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') anon_must_be_false,has_function_privilege('authenticated','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') authenticated_must_be_false,has_function_privilege('service_role','public.synchronize_media_assignment(text,uuid,uuid,text)','EXECUTE') service_role_must_be_true;
SELECT count(*) total,count(*) FILTER(WHERE is_public) public_count,count(*) FILTER(WHERE NOT is_public) internal_count,count(*) FILTER(WHERE file_path IS NOT NULL) legacy_paths,min(file_size) min_bytes,max(file_size) max_bytes FROM public.news_documents;
SELECT mime_type,count(*),min(file_size),max(file_size) FROM public.news_documents GROUP BY mime_type ORDER BY count(*) DESC;
SELECT file_path,file_url,count(*) FROM public.news_documents WHERE file_path IS NOT NULL OR file_url IS NOT NULL GROUP BY file_path,file_url HAVING count(*)>1;
SELECT nd.id,nd.media_asset_id,ma.media_kind,ma.visibility,ma.is_archived FROM public.news_documents nd LEFT JOIN public.media_assets ma ON ma.id=nd.media_asset_id WHERE nd.media_asset_id IS NOT NULL AND (ma.id IS NULL OR ma.media_kind<>'document' OR ma.is_archived);
SELECT entity_type,entity_id,field_name,count(*) FROM public.media_asset_usages WHERE entity_type='news_document' GROUP BY entity_type,entity_id,field_name HAVING count(*)>1;
SELECT nd.id FROM public.news_documents nd LEFT JOIN public.media_asset_usages u ON u.entity_type='news_document' AND u.entity_id=nd.id AND u.field_name='file' AND u.media_asset_id=nd.media_asset_id WHERE nd.media_asset_id IS NOT NULL AND u.id IS NULL;
SELECT u.* FROM public.media_asset_usages u LEFT JOIN public.news_documents nd ON nd.id=u.entity_id WHERE u.entity_type='news_document' AND (nd.id IS NULL OR nd.media_asset_id IS DISTINCT FROM u.media_asset_id);
SELECT nd.id,nd.media_asset_id,ma.visibility FROM public.news_documents nd JOIN public.media_assets ma ON ma.id=nd.media_asset_id WHERE nd.is_public AND ma.visibility<>'public';
SELECT nd.id,ma.id AS possible_asset_id FROM public.news_documents nd JOIN public.media_assets ma ON nd.media_asset_id IS NULL AND (ma.storage_path=nd.file_path OR ma.original_filename=nd.file_name) ORDER BY nd.id;
