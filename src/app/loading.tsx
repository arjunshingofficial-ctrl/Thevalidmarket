export default function RootLoading() {
  // Returns an empty container to prevent the layout from collapsing.
  // This allows the URL to change instantly upon clicking a link,
  // without displaying an intrusive full-screen spinner. 
  // The top progress bar will handle the visual feedback.
  return <div className="min-h-[80vh] bg-slate-50/50 transition-opacity duration-200 opacity-50"></div>;
}
