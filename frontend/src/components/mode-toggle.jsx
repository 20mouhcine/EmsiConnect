import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

function ModeToggle() {
  const { theme,setTheme } = useTheme()
  return (
        <Button variant="outline" size="icon" onClick={()=>theme==="light"?setTheme("dark"): setTheme("light")}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
  )
}
export default ModeToggle
