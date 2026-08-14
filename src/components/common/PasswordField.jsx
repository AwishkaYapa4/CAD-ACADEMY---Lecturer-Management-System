import { useState } from 'react'
import { Copy, Dices, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'

function generatePassword(length = 12) {
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (n) => CHARS[n % CHARS.length]).join('')
}

/** Password input with generate/show-hide/copy — used wherever Admin sets a login password directly. */
export function PasswordField({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false)

  const handleGenerate = () => {
    onChange(generatePassword())
    setVisible(true)
  }

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    toast.success('Password copied to clipboard')
  }

  return (
    <div className="flex gap-1.5">
      <div className="relative flex-1">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          <span className="sr-only">{visible ? 'Hide password' : 'Show password'}</span>
        </button>
      </div>
      <Button type="button" variant="outline" size="icon" onClick={handleGenerate} title="Generate password">
        <Dices className="size-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={handleCopy} title="Copy password">
        <Copy className="size-4" />
      </Button>
    </div>
  )
}
