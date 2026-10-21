// Confirmed school information, rendered as static HTML in each language.
export function renderSchoolDetails(document, t, prefix, images, base) {
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const image = (source, className='') => `<img class="${className}" loading="lazy" decoding="async" src="${source}" alt="${escape(t.alts[source])}">`;
  const map = 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent('Uellendahler Straße 23, 42107 Wuppertal, Germany');
  const certificate = prefix+'assets/documents/oleksandr-shelest-1-dan.pdf';
  const coachPhoto='src/photos/5386654082233212453.jpg';
  const coachImage=$('.coach-image');
  coachImage.innerHTML=`${image(coachPhoto)}<p class="archive-caption">${escape(t.coachPhotoCaption)}</p><div class="certificate-card"><a class="certificate-preview" href="${certificate}" aria-label="${escape(t.certificateLink)}">${image('src/photos/ukf-certificate.png')}</a><h3>${escape(t.certificateTitle)}</h3><p>${escape(t.certificateText)}</p><a href="${certificate}" class="document-link">${escape(t.certificateLink)} <span aria-hidden="true">↗</span></a></div>`;
  const career=document.createElement('div');career.className='coach-details';
  career.innerHTML=`<h3>${escape(t.careerTitle)}</h3><dl class="career-list">${t.career.map(([year,description])=>`<div><dt>${escape(year)}</dt><dd>${escape(description)}</dd></div>`).join('')}</dl><h3>${escape(t.coachApproachTitle)}</h3><p>${escape(t.coachApproach)}</p><blockquote>${escape(t.coachQuote)}</blockquote>`;
  $('.coach-copy').insertBefore(career,$('.signature'));
  $('.signature').innerHTML=`${escape(t.coachName)}<small>${escape(t.coachRole)}</small>`;

  [30,20,1].forEach((number,i)=>{
    const el=document.querySelectorAll('.numbers strong')[i];
    el.dataset.count=String(number);el.dataset.suffix=i<2?'+':'';el.textContent=number+(i<2?'+':'');
  });
  $('.photo.tall img').setAttribute('src','src/photos/5386654082233212532.jpg');

  const schedule=document.createElement('section');schedule.id='zeiten';schedule.className='schedule';schedule.setAttribute('aria-labelledby','schedule-title');
  const groupPhotos=['src/photos/5386654082233212536.jpg','src/photos/5386654082233212533.jpg'];
  const posters=['src/photos/5380062883686851554.jpg','src/photos/5380062883686851553.jpg'];
  schedule.innerHTML=`<div class="section-index">${escape(t.scheduleIndex)}</div><h2 id="schedule-title">${t.scheduleTitle}</h2><p class="schedule-intro">${escape(t.scheduleIntro)}</p><div class="schedule-grid">${t.groupNames.map((name,i)=>`<article class="schedule-card">${image(groupPhotos[i],'schedule-photo')}<div class="schedule-card-copy"><h3>${escape(name)}</h3><table><caption class="visually-hidden">${escape(name)} — ${escape(t.scheduleNav)}</caption><tbody>${t.weekdays.map(day=>`<tr><th scope="row">${escape(day)}</th><td><time datetime="${i===0?'17:00':'18:00'}">${i===0?'17:00':'18:00'}</time></td></tr>`).join('')}</tbody></table><a class="poster-link" href="${prefix+images[posters[i]].variants.at(-1).path}">${escape(t.scheduleImage)} <span aria-hidden="true">↗</span></a></div></article>`).join('')}</div><p class="schedule-note">${escape(t.scheduleNote)}</p><a class="button yellow" href="https://wa.me/4915730872694">${escape(t.primary)} <b aria-hidden="true">↗</b></a>`;
  $('.numbers').before(schedule);
  const nav=document.createElement('a');nav.href='#zeiten';nav.textContent=t.scheduleNav;$('.nav nav').insertBefore(nav,$('.nav nav a[href="#coach"]'));
  $('.experience-copy .button').setAttribute('href','#zeiten');

  const newPhotos=['5386654082233212628','5386654082233212536','5386654082233212533','5386654082233212532','5386654082233212531','5386654082233212527','5386654082233212522'];
  newPhotos.forEach((id,i)=>{
    const index=i+4;const source='src/photos/'+id+'.jpg';const [heading,description]=t.galleryNew[i];
    const slide=document.createElement('div');slide.className='carousel-item';
    slide.innerHTML=`${image(source,'d-block w-100')}<div class="gallery-caption"><span></span><h3>${escape(heading)}</h3><p>${escape(description)}</p></div>`;
    $('.carousel-inner').appendChild(slide);
    const thumb=document.createElement('button');thumb.type='button';thumb.setAttribute('data-bs-target','#clubGallery');thumb.setAttribute('data-bs-slide-to',String(index));thumb.setAttribute('aria-label',`${t.image} ${index+1}`);thumb.innerHTML=image(source);
    thumb.querySelector('img').alt='';$('.gallery-thumbs').appendChild(thumb);
  });
  const slides=[...document.querySelectorAll('.carousel-item')];
  slides.forEach((slide,i)=>{slide.querySelector('.gallery-caption span').textContent=`${String(i+1).padStart(2,'0')} / ${slides.length}`;});

  const location=document.createElement('section');location.className='location';location.id='anfahrt';location.setAttribute('aria-labelledby','location-title');
  location.innerHTML=`<div><div class="section-index">${escape(t.locationIndex)}</div><h2 id="location-title">${t.locationTitle}</h2><p>${escape(t.locationText)}</p></div><div class="address-card"><span>${escape(t.addressLabel)}</span><address>Uellendahler Straße 23<br>42107 Wuppertal</address><a class="button yellow" href="${map}">${escape(t.mapLink)} <b aria-hidden="true">↗</b></a><a class="location-phone" href="tel:+4915730872694">+49 157 30872694</a><p>${escape(t.weekdays.join(' · '))}<br><strong>17:00</strong> — ${escape(t.groupNames[0])}<br><strong>18:00</strong> — ${escape(t.groupNames[1])}</p></div>`;
  $('#kontakt').before(location);
  const footerAddress=document.createElement('address');footerAddress.textContent='Uellendahler Straße 23 · 42107 Wuppertal';$('footer > div:nth-child(2)').prepend(footerAddress);

  const schema=JSON.parse($('script[type="application/ld+json"]').textContent);
  schema['@type']=['SportsActivityLocation','SportsOrganization'];
  schema.address={'@type':'PostalAddress',streetAddress:'Uellendahler Straße 23',postalCode:'42107',addressLocality:'Wuppertal',addressCountry:'DE'};
  schema.hasMap=map;
  schema.image=base+images[groupPhotos[0]].variants.at(-1).path;
  schema.employee={'@type':'Person','@id':base+'#trainer',name:'Oleksandr Shelest',alternateName:['Alexander Shelest','Александр Шелест','Олександр Шелест'],jobTitle:t.coachRole,description:t.coachText,url:base+'#coach',hasCredential:{'@type':'EducationalOccupationalCredential',name:'1. Dan Karate',recognizedBy:{'@type':'Organization',name:'Ukrainian Karate Federation'},url:base+'assets/documents/oleksandr-shelest-1-dan.pdf'}};
  $('script[type="application/ld+json"]').textContent=JSON.stringify(schema);
}
