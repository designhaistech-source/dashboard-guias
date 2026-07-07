import footerImg from "@/assets/footer.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background mt-auto">
      <img
        src={footerImg.url}
        alt="© 2026 HaisGuias — Todos os direitos reservados. Uma iniciativa de HaisTech e CAORN."
        className="w-full h-auto block"
      />
    </footer>
  );
}
