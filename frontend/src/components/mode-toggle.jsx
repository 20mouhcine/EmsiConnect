import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

function ModeToggle() {
  const { theme,setTheme } = useTheme()
  const isDarkTheme = theme === 'dark';
  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-gray-600" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
        <DropdownMenuItem onClick={() => setTheme("light")} className={`${isDarkTheme ? 'bg-black' : 'bg-white'}`} >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className={`${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className={`${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ModeToggle
