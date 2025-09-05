"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, LogOut, Edit2, Trash2, GripVertical } from "lucide-react"
import { useRouter } from "next/navigation"

export default function IELTSWritingApp() {
  const [user, setUser] = useState(null)
  const [essays, setEssays] = useState([])
  const [selectedEssay, setSelectedEssay] = useState(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadEssays()
      } else {
        setUser(null)
        setEssays([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      loadEssays()
    }
  }

  const loadEssays = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("ielts_essays").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setEssays(data || [])
    } catch (error) {
      console.error("Error loading essays:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const countWords = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    setWordCount(countWords(newContent))
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please enter both title and content")
      return
    }

    setIsSaving(true)
    try {
      const essayData = {
        title: title.trim(),
        content: content.trim(),
        word_count: wordCount,
        user_id: user.id,
      }

      let result
      if (selectedEssay) {
        result = await supabase.from("ielts_essays").update(essayData).eq("id", selectedEssay.id).select().single()
      } else {
        result = await supabase.from("ielts_essays").insert(essayData).select().single()
      }

      if (result.error) throw result.error

      await loadEssays()
      setSelectedEssay(result.data)

      alert("Essay saved successfully!")
    } catch (error) {
      console.error("Error saving essay:", error)
      alert("Error saving essay. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewEssay = () => {
    setSelectedEssay(null)
    setTitle("")
    setContent("")
    setWordCount(0)
  }

  const handleSelectEssay = (essay) => {
    setSelectedEssay(essay)
    setTitle(essay.title)
    setContent(essay.content)
    setWordCount(essay.word_count)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleDeleteEssay = async (essayId, essayTitle) => {
    if (!confirm(`Are you sure you want to delete "${essayTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.from("ielts_essays").delete().eq("id", essayId)

      if (error) throw error

      // If the deleted essay was selected, clear the editor
      if (selectedEssay?.id === essayId) {
        handleNewEssay()
      }

      await loadEssays()
      alert("Essay deleted successfully!")
    } catch (error) {
      console.error("Error deleting essay:", error)
      alert("Error deleting essay. Please try again.")
    }
  }

  const handleEditEssay = (essay) => {
    setSelectedEssay(essay)
    setTitle(essay.title)
    setContent(essay.content)
    setWordCount(essay.word_count)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">IELTS Writing</h1>
            <p className="text-gray-600 mt-2">Sign in to start practicing</p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Sign In
            </Button>
            <Button onClick={() => router.push("/auth/sign-up")} variant="outline" className="w-full">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        <div className="w-72 bg-gray-50 border-r border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold text-gray-900">Essays</h1>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700 p-1">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleNewEssay}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              New Essay
            </button>
          </div>

          {/* Essays List */}
          <div className="p-4">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8 text-sm">Loading...</div>
            ) : essays.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No essays yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {essays.map((essay) => (
                  <div
                    key={essay.id}
                    className={`group relative p-3 rounded-md border transition-colors ${
                      selectedEssay?.id === essay.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <button onClick={() => handleSelectEssay(essay)} className="w-full text-left">
                      <h3 className="font-medium text-gray-900 text-sm truncate pr-16">{essay.title}</h3>
                      <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                        <span>{essay.word_count} words</span>
                        <span>{new Date(essay.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditEssay(essay)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit essay"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEssay(essay.id, essay.title)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                        title="Delete essay"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-6 space-y-6 h-full">
            {/* Title Input */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Essay title..."
                className="text-xl font-medium border-0 border-b border-gray-200 rounded-none px-0 focus:border-gray-400 focus:ring-0"
              />
            </div>

            {/* Writing Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Word count: {wordCount}</span>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  size="sm"
                  className="bg-black hover:bg-gray-800"
                >
                  {isSaving ? "Saving..." : selectedEssay ? "Update" : "Save"}
                </Button>
              </div>
              <div className="flex-1 relative">
                <Textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start writing your essay..."
                  className="flex-1 h-full border-0 resize-none focus:ring-0 text-base leading-relaxed p-0"
                  style={{ resize: "vertical", minHeight: "200px" }}
                />
                <div className="absolute bottom-0 right-0 p-2 text-gray-400 cursor-se-resize">
                  <GripVertical className="h-4 w-4 rotate-45" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
