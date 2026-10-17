import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MessageCircle, Sprout } from 'lucide-react'
import { LocalizedContent } from '../i18n'

const CONTACT_EMAIL = 'admin@cropshield.com'

export default function ContactPage() {
  const handleSubmit = event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = form.get('name')
    const email = form.get('email')
    const subject = form.get('subject')
    const message = form.get('message')
    const body = `From: ${name}\nReply to: ${email}\n\n${message}`
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  return (
    <LocalizedContent>
      <div className="page-body contact-page">
        <section className="contact-hero">
          <div className="contact-hero-copy">
            <span className="contact-eyebrow"><Sprout size={15} /> CropShield support</span>
            <h1>We’re here to help your harvest go further.</h1>
            <p>Questions about crop assessments, storage guidance, or mandi prices? Send our team a note and we’ll be glad to help.</p>
            <a className="contact-email-link" href={`mailto:${CONTACT_EMAIL}`}>
              <Mail size={17} /> {CONTACT_EMAIL} <ArrowRight size={15} />
            </a>
          </div>
          <div className="contact-hero-art" aria-hidden="true">
            <img src="/cropshield-field.png" alt="" />
            <div className="contact-art-note"><MessageCircle size={17} /><span><b>Here for farmers</b><small>Practical support, one step at a time</small></span></div>
          </div>
        </section>

        <section className="contact-content">
          <div className="contact-card contact-info-card">
            <span className="contact-section-label">Get in touch</span>
            <h2>How can we help?</h2>
            <p>Tell us what you’re working on and include any details that will help us understand your question.</p>
            <div className="contact-info-item"><span className="contact-info-icon"><Mail size={18} /></span><span><b>Email our team</b><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></span></div>
            <div className="contact-info-item"><span className="contact-info-icon"><Sprout size={18} /></span><span><b>Explore CropShield</b><small>Find market tools and crop guidance while you wait.</small></span></div>
            <div className="contact-quick-links"><Link to="/finder">Browse mandi prices <ArrowRight size={15} /></Link><Link to="/about">About CropShield <ArrowRight size={15} /></Link></div>
          </div>

          <form className="contact-card contact-form-card" onSubmit={handleSubmit}>
            <span className="contact-section-label">Send a message</span>
            <h2>Write to our team</h2>
            <label htmlFor="contact-name">Your name</label>
            <input id="contact-name" name="name" autoComplete="name" required />
            <label htmlFor="contact-email">Your email</label>
            <input id="contact-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="contact-subject">Subject</label>
            <input id="contact-subject" name="subject" required />
            <label htmlFor="contact-message">Message</label>
            <textarea id="contact-message" name="message" rows="4" required />
            <p className="contact-form-hint">Submitting opens your email app with your message ready to send.</p>
            <button type="submit" className="contact-submit">Continue to email <ArrowRight size={16} /></button>
          </form>
        </section>
      </div>
    </LocalizedContent>
  )
}
