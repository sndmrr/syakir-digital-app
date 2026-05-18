-- Allow admins to insert tagihan for any user
CREATE POLICY "Admins can insert tagihan"
ON public.tagihan
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public search RPC for Cek Tagihan (anon users on auth page)
CREATE OR REPLACE FUNCTION public.search_tagihan_by_name(search_name text)
RETURNS TABLE (
  id uuid,
  nama text,
  jumlah numeric,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.nama, t.jumlah, t.status, t.created_at
  FROM public.tagihan t
  WHERE t.deleted_at IS NULL
    AND search_name IS NOT NULL
    AND length(trim(search_name)) > 0
    AND t.nama ILIKE '%' || trim(search_name) || '%'
  ORDER BY t.created_at DESC
  LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION public.search_tagihan_by_name(text) TO anon, authenticated;