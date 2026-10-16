import { Link } from 'react-router-dom'
import { useTitulo } from '../lib/titulo'

type Secao = [string, string[]]

const TERMOS: Secao[] = [
  ['1. Sobre a plataforma', ['A Universidade dos Negócios é um ambiente online em que produtores publicam e vendem cursos e infoprodutos, e alunos os adquirem e acessam. Ao criar uma conta ou realizar uma compra, você concorda com estes termos.']],
  ['2. Cadastro e conta', ['Você deve informar dados verdadeiros e manter sua senha em sigilo. Você é responsável pelas ações realizadas na sua conta. O acesso aos cursos é pessoal e intransferível.']],
  ['3. Compras, acesso e garantia', ['O preço, as formas de pagamento e o prazo de garantia são exibidos na página de cada produto antes da compra. O acesso é liberado após a aprovação do pagamento. Dentro do prazo de garantia informado, você pode solicitar o reembolso, e o acesso ao conteúdo é encerrado.']],
  ['4. Conteúdo e propriedade intelectual', ['Os cursos pertencem aos seus produtores. É proibido copiar, redistribuir, revender ou compartilhar o conteúdo, os vídeos e os materiais. O descumprimento pode levar ao encerramento do acesso, sem reembolso.']],
  ['5. Produtores e afiliados', ['Produtores respondem pelo conteúdo que publicam e pelas promessas feitas em suas páginas de venda. Sobre cada venda aprovada incide a taxa da plataforma informada no painel. Afiliados recebem a comissão definida pelo produtor, e podem ter a comissão cancelada em caso de reembolso ou fraude.']],
  ['6. Conduta', ['Não é permitido publicar conteúdo ilegal, ofensivo ou que viole direitos de terceiros, nem usar a plataforma para fraudes. Podemos suspender contas que descumpram estes termos.']],
  ['7. Alterações e contato', ['Podemos atualizar estes termos; a versão vigente fica sempre nesta página. Dúvidas: suporte@universidadedosnegocios.com.br.']],
]

const PRIVACIDADE: Secao[] = [
  ['1. Quais dados coletamos', ['Nome, e-mail e senha (armazenada de forma criptografada) no cadastro; dados de compra, como produto, valor, forma de pagamento e status; e o seu progresso e comentários nos cursos. Dados de cartão são tratados diretamente pelo meio de pagamento e não ficam armazenados na plataforma.']],
  ['2. Para que usamos', ['Para criar sua conta, liberar o acesso aos cursos, processar pagamentos e reembolsos, calcular comissões, emitir certificados, prestar suporte e cumprir obrigações legais.']],
  ['3. Compartilhamento', ['O produtor do curso que você comprou recebe seu nome e e-mail para entregar o produto e dar suporte. Processadores de pagamento e provedores de infraestrutura tratam dados em nosso nome. Não vendemos seus dados.']],
  ['4. Seus direitos (LGPD)', ['Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade e exclusão dos seus dados, e revogar consentimentos. Escreva para suporte@universidadedosnegocios.com.br.']],
  ['5. Retenção e segurança', ['Mantemos os dados pelo tempo necessário às finalidades acima e às obrigações legais e fiscais. Adotamos controles de acesso e criptografia em trânsito para proteger as informações.']],
  ['6. Cookies', ['Usamos armazenamento do navegador para manter sua sessão e lembrar preferências, como o link de afiliado de origem de uma compra.']],
]

export default function Legal({ tipo }: { tipo: 'termos' | 'privacidade' }) {
  const termos = tipo === 'termos'
  useTitulo(termos ? 'Termos de uso' : 'Política de privacidade')
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Institucional</p>
      <h1 className="mt-2 text-4xl">{termos ? 'Termos de uso' : 'Política de privacidade'}</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: 15 de outubro de 2026.</p>
      <div className="mt-8 space-y-7">
        {(termos ? TERMOS : PRIVACIDADE).map(([t, ps]) => (
          <section key={t}><h2 className="text-xl">{t}</h2>{ps.map((p) => <p key={p} className="mt-2 leading-relaxed text-ink/80">{p}</p>)}</section>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted">Veja também: <Link className="text-brand hover:underline" to={termos ? '/privacidade' : '/termos'}>{termos ? 'Política de privacidade' : 'Termos de uso'}</Link>.</p>
    </main>
  )
}
