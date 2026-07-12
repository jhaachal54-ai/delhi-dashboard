// Re-mounted by the App Router on every navigation, so the enter animation
// plays each time the user switches pages.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
