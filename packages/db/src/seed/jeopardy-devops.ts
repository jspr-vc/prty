import type { JeopardyPack } from '@workspace/game-jeopardy'

/**
 * For a room of infrastructure people. Harder than the Dev pack and pointed at
 * operations rather than programming: containers, clusters, pipelines, pagers.
 */
export const devOpsTriviaPack: JeopardyPack = {
  rounds: [
    {
      name: 'Jeopardy',
      values: [200, 400, 600, 800, 1000],
      categories: [
        {
          name: 'Containers',
          clues: [
            {
              clue: 'The 2013 project that put Linux containers in front of everyone, with a file of build instructions.',
              answer: 'What is Docker?',
              dailyDouble: false,
            },
            {
              clue: 'The Dockerfile instruction that names the base image.',
              answer: 'What is FROM?',
              dailyDouble: false,
            },
            {
              clue: 'A container runs from one of these: a stack of read-only layers.',
              answer: 'What is an image?',
              dailyDouble: false,
            },
            {
              clue: 'This flag in docker run publishes a container port to the host.',
              answer: 'What is -p, or --publish?',
              dailyDouble: true,
            },
            {
              clue: 'The open standard governing container image and runtime formats, abbreviated OCI.',
              answer: 'What is the Open Container Initiative?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Kubernetes',
          clues: [
            {
              clue: 'The smallest deployable unit in Kubernetes.',
              answer: 'What is a pod?',
              dailyDouble: false,
            },
            {
              clue: 'The command-line tool for talking to a cluster.',
              answer: 'What is kubectl?',
              dailyDouble: false,
            },
            {
              clue: 'This object manages ReplicaSets and rolls out updates to them.',
              answer: 'What is a Deployment?',
              dailyDouble: false,
            },
            {
              clue: 'The object that puts one stable network address in front of a set of pods.',
              answer: 'What is a Service?',
              dailyDouble: false,
            },
            {
              clue: "Kubernetes' package manager, whose packages are called charts.",
              answer: 'What is Helm?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Infrastructure As Code',
          clues: [
            {
              clue: "HashiCorp's tool whose configuration files end in .tf.",
              answer: 'What is Terraform?',
              dailyDouble: false,
            },
            {
              clue: 'The Linux Foundation fork of Terraform, run with the tofu command.',
              answer: 'What is OpenTofu?',
              dailyDouble: false,
            },
            {
              clue: "AWS's own infrastructure-as-code service, written in YAML or JSON templates.",
              answer: 'What is CloudFormation?',
              dailyDouble: false,
            },
            {
              clue: 'The Terraform file recording the mapping between your configuration and real resources.',
              answer: 'What is the state file?',
              dailyDouble: false,
            },
            {
              clue: 'This Red Hat configuration-management tool is agentless and organises work into playbooks.',
              answer: 'What is Ansible?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Pipelines',
          clues: [
            {
              clue: "GitHub's built-in CI, configured under .github/workflows.",
              answer: 'What are GitHub Actions?',
              dailyDouble: false,
            },
            {
              clue: "The 'D' in CI/CD that pushes every passing build straight to production, with no human approving the release.",
              answer: 'What is continuous deployment?',
              dailyDouble: false,
            },
            {
              clue: 'A release strategy running two identical environments and switching traffic between them.',
              answer: 'What is blue-green deployment?',
              dailyDouble: false,
            },
            {
              clue: 'Rolling a release out to a small slice of traffic first, named after a bird once taken down mines.',
              answer: 'What is a canary deployment?',
              dailyDouble: false,
            },
            {
              clue: 'Keeping a Git repository as the source of truth for cluster state, with tools like Argo CD and Flux.',
              answer: 'What is GitOps?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Observability',
          clues: [
            {
              clue: 'Metrics, traces and these make up the three pillars of observability.',
              answer: 'What are logs?',
              dailyDouble: false,
            },
            {
              clue: 'This time-series database scrapes metrics endpoints and is queried with PromQL.',
              answer: 'What is Prometheus?',
              dailyDouble: false,
            },
            {
              clue: 'The dashboarding tool most often paired with Prometheus.',
              answer: 'What is Grafana?',
              dailyDouble: false,
            },
            {
              clue: 'The vendor-neutral standard for traces, metrics and logs, abbreviated OTel.',
              answer: 'What is OpenTelemetry?',
              dailyDouble: false,
            },
            {
              clue: 'A reliability target like 99.9% availability, agreed internally rather than contractually.',
              answer: 'What is an SLO, or service level objective?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
    {
      name: 'Double Jeopardy',
      values: [400, 800, 1200, 1600, 2000],
      categories: [
        {
          name: 'In The Cloud',
          clues: [
            {
              clue: "AWS's object storage service, named for the three S's in Simple Storage Service.",
              answer: 'What is S3?',
              dailyDouble: false,
            },
            {
              clue: "Google Cloud's managed Kubernetes offering, three letters.",
              answer: 'What is GKE?',
              dailyDouble: false,
            },
            {
              clue: "AWS's serverless function service, launched in 2014.",
              answer: 'What is Lambda?',
              dailyDouble: false,
            },
            {
              clue: 'The AWS region code for Northern Virginia, and the one that takes the internet with it.',
              answer: 'What is us-east-1?',
              dailyDouble: true,
            },
            {
              clue: "Microsoft's cloud platform, dropping 'Windows' from its name in 2014.",
              answer: 'What is Azure?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Linux And Shell',
          clues: [
            {
              clue: 'The command that changes a file’s permission bits.',
              answer: 'What is chmod?',
              dailyDouble: false,
            },
            {
              clue: 'The signal kill -9 sends.',
              answer: 'What is SIGKILL?',
              dailyDouble: false,
            },
            {
              clue: 'The systemd command for starting, stopping and inspecting services.',
              answer: 'What is systemctl?',
              dailyDouble: false,
            },
            {
              clue: 'The file in /etc that maps hostnames to addresses before DNS is consulted.',
              answer: 'What is /etc/hosts?',
              dailyDouble: false,
            },
            {
              clue: 'This command reports free and used disk space per filesystem.',
              answer: 'What is df?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Networking',
          clues: [
            {
              clue: 'The default port for HTTPS.',
              answer: 'What is 443?',
              dailyDouble: false,
            },
            {
              clue: 'The DNS record type mapping a name to an IPv4 address.',
              answer: 'What is an A record?',
              dailyDouble: false,
            },
            {
              clue: 'The number of steps in the TCP handshake.',
              answer: 'What is three?',
              dailyDouble: false,
            },
            {
              clue: 'The RFC defining the private address ranges 10.x, 172.16.x and 192.168.x.',
              answer: 'What is RFC 1918?',
              dailyDouble: false,
            },
            {
              clue: 'It is always this, according to the haiku — even when it is not this.',
              answer: 'What is DNS?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'When It Breaks',
          clues: [
            {
              clue: 'The write-up after an outage, ideally blameless.',
              answer: 'What is a postmortem?',
              dailyDouble: false,
            },
            {
              clue: 'Mean time to recovery, abbreviated.',
              answer: 'What is MTTR?',
              dailyDouble: false,
            },
            {
              clue: 'The engineer holding the pager this week is said to be this.',
              answer: 'What is on-call?',
              dailyDouble: false,
            },
            {
              clue: 'A cascading failure in which clients retrying in unison overwhelm a recovering service.',
              answer: 'What is a thundering herd, or a retry storm?',
              dailyDouble: false,
            },
            {
              clue: 'Deployment frequency, lead time for changes, change failure rate and time to restore service are these four metrics.',
              answer: 'What are the DORA metrics?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Locks And Keys',
          clues: [
            {
              clue: "HashiCorp's secrets management tool.",
              answer: 'What is Vault?',
              dailyDouble: false,
            },
            {
              clue: 'Granting only the permissions actually needed is this principle.',
              answer: 'What is least privilege?',
              dailyDouble: false,
            },
            {
              clue: 'The protocol securing HTTP today, having replaced SSL.',
              answer: 'What is TLS?',
              dailyDouble: false,
            },
            {
              clue: "AWS's service for handing out temporary credentials by assuming a role.",
              answer: 'What is STS, or Security Token Service?',
              dailyDouble: false,
            },
            {
              clue: 'The file every repository needs so that .env is never committed.',
              answer: 'What is .gitignore?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'Site Reliability',
    clue: "In Google's SRE practice, this is the amount of unreliability a service is permitted to spend before feature releases stop.",
    answer: 'What is an error budget?',
  },
}
