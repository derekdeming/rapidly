const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return <main className="h-full bg-gradient-to-r from-blue-100 to-purple-100 overflow-y-auto overflow-x-hidden">
    {/* <div className="mx-auto max-w-screen-xl h-full w-full" > */}
      {children}
    {/* </div> */}
  </main>
}

export default LandingLayout
