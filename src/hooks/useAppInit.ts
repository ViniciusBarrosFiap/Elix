import { useEffect, useState } from "react"
import { UserService } from "@/src/services/user/user.service"
import { StudyContentService } from "@/src/services/studyContent/studyContent.service"

export function useAppInit() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      await Promise.all([
        UserService.initialize(),
        StudyContentService.initialize(),
        new Promise(resolve => setTimeout(resolve, 3500)) // Simula um tempo mínimo de loading
      ])
      setReady(true)
    }

    init()
  }, [])

  return ready
}